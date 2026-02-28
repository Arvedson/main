import { useState, useCallback } from 'react';

export function useTapTempo(onChange: (bpm: number) => void) {
  const [taps, setTaps] = useState<number[]>([]);

  const handleTap = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const now = Date.now();
    
    let newTaps: number[] = [];
    setTaps((prev) => {
      // Keep only the last 5 taps within the last 5 seconds
      const validTaps = prev.filter(t => now - t < 5000);
      newTaps = [...validTaps, now];
      return newTaps;
    });

    if (newTaps.length > 1) {
      let totalInterval = 0;
      for (let i = 1; i < newTaps.length; i++) {
        totalInterval += newTaps[i] - newTaps[i - 1];
      }
      const avgInterval = totalInterval / (newTaps.length - 1);
      const currentBpm = Math.round(60000 / avgInterval);
      
      // Clamp between typical ranges (40 to 220)
      const finalBpm = Math.min(Math.max(currentBpm, 40), 220);
      onChange(finalBpm);
    }
  }, [onChange]);

  return { handleTap, taps };
}
