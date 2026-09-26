import { User, DeviceSavedAccount } from '../types';

const STORAGE_KEY = 'hekawy_device_saved_accounts';

/**
 * Retrieves all saved accounts stored on this device.
 */
export function getSavedDeviceAccounts(): DeviceSavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
    }
  } catch (err) {
    console.warn('Failed to parse saved device accounts:', err);
  }
  return [];
}

/**
 * Saves or updates a user account in the device's saved accounts list.
 */
export function saveDeviceAccount(user: User, ownerToken?: string): DeviceSavedAccount[] {
  if (!user || !user.id) return getSavedDeviceAccounts();

  const currentAccounts = getSavedDeviceAccounts();
  const existingOwnerToken = ownerToken || localStorage.getItem('hekawy_owner_token') || undefined;

  const updatedAccount: DeviceSavedAccount = {
    id: user.id,
    numericId: user.numericId || user.id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    role: user.role,
    isOwner: user.isOwner || user.role === 'OWNER',
    ownerToken: (user.isOwner || user.role === 'OWNER') ? existingOwnerToken : undefined,
    level: user.level || 1,
    diamonds: user.diamonds || 0,
    coins: user.coins || 0,
    phone: user.phone,
    email: user.email,
    lastUsedAt: new Date().toISOString()
  };

  const filtered = currentAccounts.filter(acc => acc.id !== user.id);
  const updatedList = [updatedAccount, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('Failed to save device account:', err);
  }

  return updatedList;
}

/**
 * Removes an account from this device's saved list.
 * Note: This ONLY clears local cache on this phone/device.
 * It NEVER deletes user data or server account records.
 */
export function removeSavedDeviceAccount(userId: string): DeviceSavedAccount[] {
  const currentAccounts = getSavedDeviceAccounts();
  const filtered = currentAccounts.filter(acc => acc.id !== userId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to remove saved device account:', err);
  }

  return filtered;
}

/**
 * Activates session keys for the target saved account.
 */
export function activateAccountSession(account: DeviceSavedAccount) {
  localStorage.setItem('hekawy_auth_user_id', account.id);
  if (account.ownerToken && (account.isOwner || account.role === 'OWNER')) {
    localStorage.setItem('hekawy_owner_token', account.ownerToken);
  } else {
    localStorage.removeItem('hekawy_owner_token');
  }
}
