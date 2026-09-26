import React from 'react';
import { User } from '../types';
import { AccountSettingsModal } from './AccountSettingsModal';

interface FramesShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const FramesShopModal: React.FC<FramesShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  if (!isOpen) return null;

  return (
    <AccountSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      currentUser={currentUser}
      onUserUpdated={onUserUpdated}
      initialTab="frames"
      isInline={false}
    />
  );
};
