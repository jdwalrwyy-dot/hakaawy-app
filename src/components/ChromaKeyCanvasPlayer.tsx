import React, { useEffect } from 'react';

export interface ChromaKeyCanvasPlayerProps {
  videoUrl: string;
  isMuted?: boolean;
  playbackRate?: number;
  keyColor?: [number, number, number];
  similarity?: number;
  smoothness?: number;
  spill?: number;
  onEnded?: () => void;
  className?: string;
}

export const ChromaKeyCanvasPlayer: React.FC<ChromaKeyCanvasPlayerProps> = ({ onEnded }) => {
  useEffect(() => {
    if (onEnded) onEnded();
  }, [onEnded]);

  return null;
};
