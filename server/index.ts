import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import cors from "cors";
import session from "express-session";
import { sessionStore } from "./storage";
import { logger } from "./logger";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? "https://kiplangatkorir.github.io" 
    : "http://localhost:3000",
  credentials: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    log("Database connection successful");

    const server = await registerRoutes(app);

    // Set up Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      const buildPath = resolve(__dirname, "..", "dist");
      
      try {
        app.use(express.static(buildPath));
        
        // Serve index.html for any non-API routes in production
        app.get("*", (req, res) => {
          if (!req.path.startsWith("/api")) {
            res.sendFile(resolve(buildPath, "index.html"));
          }
        });
        
        logger.info(`Serving static files from: ${buildPath}`);
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      log(`Server is running on port ${port}`);
    });

  } catch (err: any) {
    log(`Error: ${err.message}`);
    process.exit(1);
  }
})();