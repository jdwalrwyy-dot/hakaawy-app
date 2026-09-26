import React from 'react';
import { VipCinematicEntranceOverlay, VIP_CINEMATIC_CONFIG } from './VipCinematicEntranceOverlay';

export interface RoomEntranceEventPayload {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  entranceId: string;
  entranceName: string;
  entranceCategory: string;
  entranceTier: string;
  soundType: string;
  durationSeconds: number;
  isOwner?: boolean;
  userRole?: string;
  renderMode?: '3D' | '5D';
}

interface RoomEntranceOverlayProps {
  currentEvent: RoomEntranceEventPayload | null;
  onAnimationComplete?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
  roomCoverImage?: string;
  isPreviewMode?: boolean;
  onClose?: () => void;
}

/**
 * 🏎️ Room Entrance System - VIP Car Video Entrance
 */
export const RoomEntranceOverlay: React.FC<RoomEntranceOverlayProps> = ({
  currentEvent,
  onAnimationComplete,
  roomCoverImage,
  onClose
}) => {
  if (!currentEvent) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onAnimationComplete) onAnimationComplete();
  };

  return (
    <VipCinematicEntranceOverlay
      userName={currentEvent.userName}
      userAvatar={currentEvent.userAvatar}
      numericId={currentEvent.userId}
      isOwner={currentEvent.isOwner}
      entranceName={currentEvent.entranceName}
      roomCoverImage={roomCoverImage}
      onComplete={handleClose}
      onSkip={handleClose}
    />
  );
};
