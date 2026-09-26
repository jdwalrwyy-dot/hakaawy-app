import React from 'react';

export interface CinematicKingEntranceProps {
  userName?: string;
  userAvatar?: string;
  durationSeconds?: number;
  roomCoverImage?: string;
  onComplete?: () => void;
}

export const CinematicKingEntrance: React.FC<CinematicKingEntranceProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) onComplete();
  }, [onComplete]);

  return null;
};
