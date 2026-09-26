/**
 * Screen & Recording Protection Service for Hekawy
 * Provides multi-layer defense against screenshots, screen recordings, screen sharing,
 * and app-switcher previews across all sensitive views.
 */

type CaptureAttemptCallback = (type: 'SCREENSHOT_KEY' | 'SCREEN_SHARE_ATTEMPT' | 'PRINT_ATTEMPT' | 'DEVTOOLS_ATTEMPT') => void;

class ScreenProtectionService {
  private isInitialized = false;
  private listeners: CaptureAttemptCallback[] = [];
  private isWindowFocused = true;
  private isDocumentVisible = true;
  private stateChangeListeners: ((isObscured: boolean) => void)[] = [];

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Intercept Screenshot & Print Keyboard Shortcuts
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);

    // 2. Intercept Print events
    window.addEventListener('beforeprint', this.handleBeforePrint);

    // 3. Monitor Focus / Blur / Visibility for Recent Apps & Screen Switcher
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('pagehide', this.handleWindowBlur);

    // 4. Intercept getDisplayMedia (Screen Sharing / Screen Recording)
    this.interceptScreenSharing();

    // 5. Inject CSS anti-selection & drag protection
    this.injectAntiCaptureStyles();
  }

  public onCaptureAttempt(cb: CaptureAttemptCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public onObscureStateChange(cb: (isObscured: boolean) => void): () => void {
    this.stateChangeListeners.push(cb);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== cb);
    };
  }

  private notifyAttempt(type: 'SCREENSHOT_KEY' | 'SCREEN_SHARE_ATTEMPT' | 'PRINT_ATTEMPT' | 'DEVTOOLS_ATTEMPT') {
    this.listeners.forEach(cb => {
      try {
        cb(type);
      } catch (err) {
        console.error('Error in capture attempt callback:', err);
      }
    });
  }

  private updateObscuredState() {
    const isObscured = !this.isDocumentVisible || !this.isWindowFocused;
    this.stateChangeListeners.forEach(cb => {
      try {
        cb(isObscured);
      } catch (err) {
        console.error('Error in obscure state callback:', err);
      }
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Windows PrintScreen, Alt+PrintScreen, Win+Shift+S
    if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
      e.preventDefault();
      e.stopPropagation();
      this.notifyAttempt('SCREENSHOT_KEY');
      this.obfuscateClipboard();
      return false;
    }

    // Windows Snipping tool / Mac screenshot (Cmd + Shift + 3 / 4 / 5)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['Digit3', 'Digit4', 'Digit5', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      e.stopPropagation();
      this.notifyAttempt('SCREENSHOT_KEY');
      return false;
    }

    // Ctrl+P / Cmd+P (Print to PDF)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
      e.preventDefault();
      e.stopPropagation();
      this.notifyAttempt('PRINT_ATTEMPT');
      return false;
    }

    // DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['KeyI', 'KeyJ', 'KeyC'].includes(e.code))
    ) {
      // Deter inspection of media
      this.notifyAttempt('DEVTOOLS_ATTEMPT');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
      this.obfuscateClipboard();
    }
  };

  private handleBeforePrint = (e: Event) => {
    e.preventDefault();
    this.notifyAttempt('PRINT_ATTEMPT');
  };

  private isPreviewOrIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    } catch {
      return true;
    }
  }

  private handleWindowBlur = () => {
    // In iframe or preview environment, blur triggers naturally when user interacts with host UI
    if (this.isPreviewOrIframe()) return;
    this.isWindowFocused = false;
    this.updateObscuredState();
  };

  private handleWindowFocus = () => {
    this.isWindowFocused = true;
    this.updateObscuredState();
  };

  private handleVisibilityChange = () => {
    if (this.isPreviewOrIframe()) return;
    this.isDocumentVisible = document.visibilityState === 'visible';
    this.updateObscuredState();
  };

  private obfuscateClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('⚠️ محتوى تطبيق حكاوي محمي من لقطات الشاشة.');
      }
    } catch {
      // Ignore clipboard permission restrictions
    }
  }

  private interceptScreenSharing() {
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    ) {
      navigator.mediaDevices.getDisplayMedia = async (options?: DisplayMediaStreamOptions) => {
        this.notifyAttempt('SCREEN_SHARE_ATTEMPT');
        return Promise.reject(new DOMException('Screen sharing is protected in Hekawy', 'NotAllowedError'));
      };
    }
  }

  private injectAntiCaptureStyles() {
    const styleId = 'hekawy-screen-protection-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* Prevent selection, dragging, and mobile callout menus */
      .protected-content, body {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      /* Obscure media when printing */
      @media print {
        body * {
          visibility: hidden !important;
          display: none !important;
        }
        body::before {
          content: "⚠️ عذراً، لا يمكن طباعة أو التقاط محتوى تطبيق حكاوي.";
          visibility: visible !important;
          display: block !important;
          text-align: center;
          padding: 50px;
          font-size: 24px;
          color: #ef4444;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export const screenProtectionService = new ScreenProtectionService();
