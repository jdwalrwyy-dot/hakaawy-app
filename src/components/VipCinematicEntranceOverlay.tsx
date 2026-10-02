import React, { useEffect } from 'react';

export const carVideoUrl = "";
export const entranceBgImage = "";

export interface VipCinematicAssetsConfig {
  videoUrl?: string;
  bgImageUrl?: string;
  totalDurationSeconds?: number;
  playbackRate?: number;
}

export const VIP_CINEMATIC_CONFIG: VipCinematicAssetsConfig = {
  videoUrl: '',
  bgImageUrl: '',
  totalDurationSeconds: 0,
  playbackRate: 1,
};

interface VipCinematicEntranceOverlayProps {
  userName?: string;
  userAvatar?: string;
  numericId?: string;
  isOwner?: boolean;
  entranceName?: string;
  roomCoverImage?: string;
  customConfig?: Partial<VipCinematicAssetsConfig>;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const VipCinematicEntranceOverlay: React.FC<VipCinematicEntranceOverlayProps> = ({
  onComplete,
  onSkip
}) => {
  useEffect(() => {
    if (onComplete) onComplete();
    else if (onSkip) onSkip();
  }, [onComplete, onSkip]);

  return null;
};
