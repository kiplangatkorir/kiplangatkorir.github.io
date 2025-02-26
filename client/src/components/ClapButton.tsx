import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';

interface ClapButtonProps {
  postId: number;
  initialCount: number;
  onClap?: (newCount: number) => void;
}

export function ClapButton({ postId, initialCount, onClap }: ClapButtonProps) {
  const { user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [isClapping, setIsClapping] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClap = async () => {
    if (!user) return;

    try {
      setIsClapping(true);
      const response = await fetch(`/api/posts/${postId}/clap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to clap');
      }

      const data = await response.json();
      const newCount = data.count;
      setCount(newCount);
      onClap?.(newCount);

      // Add particle effect
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100 - 50,
        y: -(Math.random() * 50 + 50),
      };
      setParticles(prev => [...prev, newParticle]);

      // Remove particle after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
    } catch (error) {
      console.error('Error clapping:', error);
    } finally {
      setIsClapping(false);
    }
  };

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute text-2xl"
            initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: 0,
              x: particle.x,
              y: particle.y,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            👏
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
          onClick={handleClap}
          disabled={isClapping || !user}
        >
          <span className="text-xl">👏</span>
          <span>{count}</span>
        </Button>
      </motion.div>
    </div>
  );
}
