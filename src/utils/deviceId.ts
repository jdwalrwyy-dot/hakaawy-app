/**
 * Device ID Utility for Hekawy
 * Ensures a persistent, secure Device ID across localStorage, sessionStorage, and cookies.
 */

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_default';

  let deviceId = '';

  try {
    deviceId = localStorage.getItem('hekawy_device_id_v1') || '';
    if (!deviceId) {
      deviceId = sessionStorage.getItem('hekawy_device_id_v1') || '';
    }
    if (!deviceId) {
      const match = document.cookie.match(/hekawy_device_id=([^;]+)/);
      if (match && match[1]) {
        deviceId = match[1];
      }
    }

    if (!deviceId || deviceId.trim().length < 8) {
      // Generate a persistent device UUID
      const randomPart = Math.random().toString(36).substring(2, 12);
      const timePart = Date.now().toString(36);
      deviceId = `dev_${timePart}_${randomPart}`;
    }

    // Synchronize across all client storage mechanisms
    localStorage.setItem('hekawy_device_id_v1', deviceId);
    sessionStorage.setItem('hekawy_device_id_v1', deviceId);
    document.cookie = `hekawy_device_id=${deviceId}; path=/; max-age=315360000; SameSite=Lax`;
  } catch (e) {
    console.warn('Failed to access storage for deviceId:', e);
    if (!deviceId) deviceId = 'dev_fallback_client';
  }

  return deviceId;
}
