/**
 * Utility for playing notification sounds with queuing and deduplication
 * Includes mobile-friendly audio handling with user gesture requirement
 */

interface NotificationOpts {
  body?: string;
  icon?: string;
  badge?: string;
  [key: string]: any;
}

interface RepeatingSoundConfig {
  enabled: boolean;
  orderId?: string;
  timeoutId?: ReturnType<typeof setInterval>;
}

/**
 * Sound notification manager with queue and deduplication
 * Includes mobile-friendly audio handling with user gesture requirement
 */
class SoundNotificationManager {
  private isPlaying = false;
  private queue: Array<{ soundUrl?: string; timestamp: number }> = [];
  private lastPlayedTime = 0;
  private minIntervalMs = 500; // Minimum gap between sounds (prevents spam)
  private audioCache = new Map<string, HTMLAudioElement>();
  private repeatingSound: RepeatingSoundConfig = { enabled: false };
  private masterVolume = 1.0; // 0 to 1, default max volume
  private audioContext: AudioContext | null = null;
  private audioContextInitialized = false;
  private audioEnabled = true;
  private isMobile = this.detectMobileDevice();

  /**
   * Detect if running on mobile device
   */
  private detectMobileDevice(): boolean {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(userAgent.toLowerCase());
  }

  /**
   * Initialize AudioContext with user gesture (required for iOS)
   * Must be called from a user interaction handler
   */
  initializeAudioContext(): void {
    if (this.audioContextInitialized) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext not supported in this browser');
        this.audioEnabled = false;
        return;
      }

      // Create a dummy oscillator to "wake up" the audio context
      this.audioContext = new AudioContextClass();

      // Create and stop a dummy sound to initialize the context
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.001);

      this.audioContextInitialized = true;
      console.log('[AUDIO] AudioContext initialized (mobile-friendly)');
    } catch (error) {
      console.warn('[AUDIO] Failed to initialize AudioContext:', error);
      this.audioEnabled = false;
    }
  }

  /**
   * Play a sound, either from queue or immediately
   */
  async play(soundUrl?: string): Promise<void> {
    if (!this.audioEnabled) return;

    const now = Date.now();

    // Add to queue
    this.queue.push({ soundUrl, timestamp: now });

    // Process queue if not already playing
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  /**
   * Process the notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const now = Date.now();

    // Wait if still within minimum interval
    if (now - this.lastPlayedTime < this.minIntervalMs) {
      setTimeout(() => this.processQueue(), this.minIntervalMs);
      return;
    }

    const queueItem = this.queue.shift();
    if (!queueItem) {
      this.isPlaying = false;
      return;
    }

    try {
      await this.playAudio(queueItem.soundUrl);
      this.lastPlayedTime = Date.now();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }

    // Process next item in queue
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Play audio file with proper mobile handling
   */
  private playAudio(soundUrl?: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!soundUrl) {
          // Use Web Audio API for default sound
          this.playBellSoundLoud();
          resolve();
          return;
        }

        // Use cached audio or create new
        if (!this.audioCache.has(soundUrl)) {
          const newAudio = new Audio(soundUrl);
          // Lower volume for file-based audio (already pre-recorded at higher level)
          newAudio.volume = this.isMobile ? 1.0 : 0.7;
          this.audioCache.set(soundUrl, newAudio);
        }
        const cachedAudio = this.audioCache.get(soundUrl);
        if (!cachedAudio) {
          console.warn('[AUDIO] Failed to get cached audio');
          resolve();
          return;
        }
        const audio = cachedAudio;

        // Reset playback position
        audio.currentTime = 0;

        const onEnded = (): void => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          resolve();
        };

        const onError = (): void => {
          console.warn('[AUDIO] Audio playback error');
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          resolve(); // Resolve even on error
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        // Set timeout as fallback (in case ended event doesn't fire)
        const timeout = setTimeout(() => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          console.debug('[AUDIO] Audio playback timeout reached');
          resolve();
        }, 3000);

        // Attempt to play
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.debug('[AUDIO] Audio playback started successfully');
              clearTimeout(timeout);
            })
            .catch((error: Error) => {
              clearTimeout(timeout);
              console.warn('[AUDIO] Audio play rejected:', error.message);
              audio.removeEventListener('ended', onEnded);
              audio.removeEventListener('error', onError);
              // Fallback to bell or vibration
              this.playBellSoundLoud();
              resolve();
            });
        }
      } catch (error) {
        console.warn('[AUDIO] Error in playAudio:', error);
        resolve();
      }
    });
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Set minimum interval between sounds
   */
  setMinInterval(ms: number): void {
    this.minIntervalMs = ms;
  }

  /**
   * Start repeating sound for new order (loud and persistent)
   * @param orderId Order ID to track
   * @param interval Interval in milliseconds between repeats (default: 2000ms)
   */
  startRepeatSound(orderId: string, interval = 2000): void {
    // Stop any existing repeating sound
    this.stopRepeatSound();

    this.repeatingSound.enabled = true;
    this.repeatingSound.orderId = orderId;

    // Play immediately
    this.playBellSoundLoud();

    // Then repeat at intervals
    this.repeatingSound.timeoutId = setInterval(() => {
      if (this.repeatingSound.enabled) {
        this.playBellSoundLoud();
      }
    }, interval);

    console.log(`Started repeating sound for order ${orderId}`);
  }

  /**
   * Stop repeating sound
   */
  stopRepeatSound(): void {
    if (this.repeatingSound.timeoutId) {
      clearInterval(this.repeatingSound.timeoutId);
      this.repeatingSound.timeoutId = undefined;
    }
    this.repeatingSound.enabled = false;
    this.repeatingSound.orderId = undefined;
    console.log('Stopped repeating sound');
  }

  /**
   * Play bell sound at high volume (loud and persistent for notifications)
   */
  private playBellSoundLoud(): void {
    try {
      // Initialize AudioContext if needed (first time)
      if (!this.audioContextInitialized) {
        this.initializeAudioContext();
      }

      if (!this.audioContext || !this.audioEnabled) {
        // Fallback to vibration on mobile
        this.tryVibration();
        return;
      }

      // Reuse existing AudioContext (avoid creating new ones which can fail on iOS)
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Create loud bell-like sound: 800Hz then 600Hz
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        600,
        this.audioContext.currentTime + 0.2
      );

      // LOUD volume with decay (0.8 max volume)
      const loudVolume = Math.min(0.8 * this.masterVolume, 1.0);
      gainNode.gain.setValueAtTime(loudVolume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.05,
        this.audioContext.currentTime + 0.5
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('[AUDIO] Failed to play loud bell sound:', error);
      // Fallback to vibration
      this.tryVibration();
    }
  }

  /**
   * Try to vibrate device (Android fallback)
   */
  private tryVibration(): void {
    try {
      if ('vibrate' in navigator) {
        // Pattern: vibrate 100ms, pause 50ms, vibrate 200ms
        navigator.vibrate([100, 50, 200]);
      }
    } catch (error) {
      console.debug('[VIBRATION] Vibration not available:', error);
    }
  }

  /**
   * Set master volume (0 to 1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(
      `Master volume set to ${(this.masterVolume * 100).toFixed(0)}%`
    );
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }
}

const soundManager = new SoundNotificationManager();

/**
 * Initialize audio context with user gesture (required for iOS)
 * Must be called from a user interaction handler (click, tap, etc.)
 */
export const initializeAudio = (): void => {
  soundManager.initializeAudioContext();
};

/**
 * Play notification sound with automatic queuing
 * @param soundUrl Optional URL to custom sound. If not provided, uses default bell.
 */
export const playNotificationSound = async (
  soundUrl?: string
): Promise<void> => {
  return soundManager.play(soundUrl);
};

/**
 * Play a custom sound from a URL
 * @param soundUrl URL to the audio file
 */
export const playCustomSound = async (soundUrl: string): Promise<void> => {
  return playNotificationSound(soundUrl);
};

/**
 * Start repeating loud notification for new orders
 * @param orderId Order ID to track
 * @param interval Interval between repeats in milliseconds (default: 2000ms)
 */
export const startRepeatNotification = (
  orderId: string,
  interval = 2000
): void => {
  soundManager.startRepeatSound(orderId, interval);
};

/**
 * Stop repeating notification
 */
export const stopRepeatNotification = (): void => {
  soundManager.stopRepeatSound();
};

/**
 * Set master volume (0 to 1, where 1 is max)
 * @param volume Volume level 0-1
 */
export const setNotificationVolume = (volume: number): void => {
  soundManager.setMasterVolume(volume);
};

/**
 * Get current master volume
 */
export const getNotificationVolume = (): number => {
  return soundManager.getMasterVolume();
};

/**
 * Clear the sound notification queue
 */
export const clearSoundQueue = (): void => {
  soundManager.clearQueue();
};

/**
 * Get current queue length
 */
export const getSoundQueueLength = (): number => {
  return soundManager.getQueueLength();
};

/**
 * Configure minimum interval between sounds (prevents spam)
 * @param ms Minimum milliseconds between sound plays (default: 500ms)
 */
export const setSoundMinInterval = (ms: number): void => {
  soundManager.setMinInterval(ms);
};

/**
 * Use browser notification API if available
 */
export const sendBrowserNotification = (
  title: string,
  options?: NotificationOpts
): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};
