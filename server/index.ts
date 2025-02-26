import express from "express";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import cors from "cors";
import session from "express-session";
import { sessionStore, storage } from "./storage";
import { logger } from "./logger";
import { router } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Session configuration
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

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? "https://kiplangatkorir.github.io" 
    : "http://localhost:3000",
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// API routes
app.use("/api", router)

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const buildPath = resolve(__dirname, "..", "..", "dist");
  
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

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});