import React, { useEffect } from 'react';

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

export const RoomEntranceOverlay: React.FC<RoomEntranceOverlayProps> = ({
  currentEvent,
  onAnimationComplete,
  onClose
}) => {
  useEffect(() => {
    if (currentEvent) {
      if (onClose) onClose();
      else if (onAnimationComplete) onAnimationComplete();
    }
  }, [currentEvent, onClose, onAnimationComplete]);

  return null;
};
