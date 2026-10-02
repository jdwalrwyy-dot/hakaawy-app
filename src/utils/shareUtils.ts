/**
 * Centralized Share App Utility for Hekawy
 * Ensures all share buttons across the entire app share the clean APK download link
 * and open as a new visitor/registration flow instead of copying personal profile URLs.
 */

export const APK_DOWNLOAD_URL = 'https://bucket.appilix.com/app-apk-be65d05044a54ca891d9b40be61a4016-1790414055.apk';

export const APP_SHARE_TEXT = 'حمل تطبيق حكاوي الآن واستمتع بأقوى الغرف الصوتية والبث المباشر:';

export const APP_SHARE_MESSAGE = `${APP_SHARE_TEXT} ${APK_DOWNLOAD_URL}`;

/**
 * Triggers native system share sheet or copies the clean share message to clipboard
 */
export async function handleShareApp(): Promise<{ success: boolean; copied: boolean }> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'تطبيق حكاوي - غرف صوتية وبث مباشر',
        text: APP_SHARE_MESSAGE,
        url: APK_DOWNLOAD_URL
      });
      return { success: true, copied: false };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, copied: false };
      }
    }
  }

  // Fallback to copying exact share message
  try {
    await navigator.clipboard.writeText(APP_SHARE_MESSAGE);
    return { success: true, copied: true };
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
    return { success: false, copied: false };
  }
}
