import { useState, useCallback } from 'react';

export function useRespiratoryTimer(onChange: (bpm: number) => void) {
  const [breathStarts, setBreathStarts] = useState<number[]>([]);
  const [isHolding, setIsHolding] = useState(false);

  const handleStartHold = useCallback(() => {
    const now = Date.now();
    setIsHolding(true);
    
    let newStarts: number[] = [];
    setBreathStarts((prev) => {
      // Keep only last 4 breath starts within last 15 seconds
      const validStarts = prev.filter(t => now - t < 15000);
      newStarts = [...validStarts, now];
      return newStarts;
    });

    if (newStarts.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < newStarts.length; i++) {
        totalInterval += newStarts[i] - newStarts[i - 1];
      }
      const avgInterval = totalInterval / (newStarts.length - 1);
      const currentBpm = Math.round(60000 / avgInterval);
      
      // Clamp between typical ranges (5 to 60)
      const finalBpm = Math.min(Math.max(currentBpm, 5), 60);
      onChange(finalBpm);
    }
  }, [onChange]);

  const handleEndHold = useCallback(() => {
    setIsHolding(false);
  }, []);

  const reset = useCallback(() => {
    setBreathStarts([]);
    setIsHolding(false);
  }, []);

  return { handleStartHold, handleEndHold, isHolding, reset };
}
