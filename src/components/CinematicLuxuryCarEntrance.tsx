import React from 'react';

export interface CinematicLuxuryCarEntranceProps {
  userName?: string;
  userAvatar?: string;
  durationSeconds?: number;
  roomCoverImage?: string;
  onComplete?: () => void;
}

export const CinematicLuxuryCarEntrance: React.FC<CinematicLuxuryCarEntranceProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) onComplete();
  }, [onComplete]);

  return null;
};
