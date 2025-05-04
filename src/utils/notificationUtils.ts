
/**
 * Shows a browser notification if permission is granted
 * @param title Title of the notification
 * @param options Notification options
 */
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported in this browser');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, options);
    
    // Play sound if it's not muted
    if (!isSoundMuted) {
      playNotificationSound();
    }
    
    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        const notification = new Notification(title, options);
        
        // Play sound if it's not muted
        if (!isSoundMuted) {
          playNotificationSound();
        }
        
        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return notification;
      }
    });
  }
};

// Audio elements for different sounds
let alarmAudio: HTMLAudioElement | null = null;
let notificationAudio: HTMLAudioElement | null = null;
let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let vibrationInterval: ReturnType<typeof setInterval> | null = null;
let isVibrating = false;
// Track alarm active state for UI usage
let isAlarmActive = false;
// Prevent alarm from retriggering after manual stop
let isAlarmManuallyDisabled = false;
// Sound muting preference (default: false)
let isSoundMuted = false;
// Vibration intensity (0-1)
let vibrationIntensity = 1.0;
// Allow subscribing to alarm state
type AlarmListener = (active: boolean) => void;
const alarmListeners: AlarmListener[] = [];
export const addAlarmListener = (cb: AlarmListener) => { alarmListeners.push(cb); };
export const removeAlarmListener = (cb: AlarmListener) => {
  const i = alarmListeners.indexOf(cb);
  if (i !== -1) alarmListeners.splice(i, 1);
};
const notifyAlarmListeners = () => {
  alarmListeners.forEach(cb => cb(isAlarmActive));
};

/**
 * Set sound mute state
 * @param muted Whether sound should be muted
 */
export const setSoundMuted = (muted: boolean) => {
  isSoundMuted = muted;
  
  // Save preference
  try {
    localStorage.setItem('sound_muted', muted ? '1' : '0');
  } catch (e) {
    console.error('Failed to save sound preference:', e);
  }
  
  // If alarm is active and we're muting, stop playing the sound
  if (muted && alarmAudio && !alarmAudio.paused) {
    alarmAudio.pause();
  } else if (!muted && isAlarmActive && alarmAudio) {
    alarmAudio.play().catch(e => console.error('Failed to play alarm sound:', e));
  }
};

/**
 * Get current sound mute state
 */
export const getSoundMuted = () => isSoundMuted;

/**
 * Set vibration intensity
 * @param intensity Vibration intensity (0-1)
 */
export const setVibrationIntensity = (intensity: number) => {
  vibrationIntensity = Math.max(0, Math.min(1, intensity));
  
  // Save preference
  try {
    localStorage.setItem('vibration_intensity', vibrationIntensity.toString());
  } catch (e) {
    console.error('Failed to save vibration preference:', e);
  }
};

/**
 * Get current vibration intensity
 */
export const getVibrationIntensity = () => vibrationIntensity;

/**
 * Load user preferences from localStorage
 */
export const loadNotificationPreferences = () => {
  try {
    const soundMuted = localStorage.getItem('sound_muted');
    if (soundMuted !== null) {
      isSoundMuted = soundMuted === '1';
    }
    
    const vibIntensity = localStorage.getItem('vibration_intensity');
    if (vibIntensity !== null) {
      vibrationIntensity = parseFloat(vibIntensity);
    }
  } catch (e) {
    console.error('Failed to load notification preferences:', e);
  }
};

/**
 * Reset the alarm manually disabled flag (used when location changes significantly)
 */
export const resetAlarmState = () => {
  isAlarmManuallyDisabled = false;
};

/**
 * Check if alarm can be triggered
 */
export const canTriggerAlarm = () => {
  return !isAlarmManuallyDisabled;
};

/**
 * Initialize the alarm audio element
 * Call this once on user gesture
 */
export const initAlarmAudio = () => {
  // Load user preferences
  loadNotificationPreferences();
  
  if (!alarmAudio && typeof Audio !== 'undefined') {
    try {
      // Use '/alarm.mp3' as default, developer can replace this file
      alarmAudio = new Audio('/alarm.mp3');
      alarmAudio.loop = true;
      
      // Preload audio for faster playback
      alarmAudio.preload = 'auto';
      alarmAudio.volume = 0.8; // Set volume to 80%
      
      // Add event listeners for better error handling
      alarmAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      // Ensure alarm can play
      alarmAudio.load();
      
      // Create notification sound
      notificationAudio = new Audio('/notification.mp3');
      notificationAudio.preload = 'auto';
      notificationAudio.volume = 0.5;
      notificationAudio.load();
      
      // Try to play and immediately pause to unlock audio on iOS
      const unlockAudio = async () => {
        try {
          await alarmAudio?.play();
          alarmAudio?.pause();
          alarmAudio!.currentTime = 0;
          
          if (notificationAudio) {
            await notificationAudio.play();
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
          }
        } catch (e) {
          // Ignore errors - this is just an attempt to unlock audio
          console.log('Initial audio play failed, may require user interaction');
        }
      };
      
      unlockAudio();
    } catch (err) {
      console.error('Failed to initialize alarm audio:', err);
    }
  }
};

/**
 * Play notification sound
 */
export const playNotificationSound = () => {
  if (isSoundMuted || !notificationAudio) return;
  
  try {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(e => {
      console.error('Failed to play notification sound:', e);
    });
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
};

/**
 * Play alarm sound with vibration for speed alerts
 * @returns Promise that resolves when the audio starts playing
 */
export const playAlarmSound = async () => {
  // Don't start alarm if already running or manually disabled
  if (isAlarmActive || isAlarmManuallyDisabled) return;
  isAlarmActive = true;
  notifyAlarmListeners();

  // Clear any previous stop timeout
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }

  if (!alarmAudio) initAlarmAudio();

  // Only play sound if not muted
  if (!isSoundMuted) {
    try {
      if (alarmAudio && alarmAudio.paused) {
        // Give a slight delay before playing to avoid stuttering
        setTimeout(async () => {
          try {
            await alarmAudio?.play();
            console.log('Speed alert alarm playing');
          } catch (e) {
            console.error('Failed to play audio on delayed attempt:', e);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }

  // Start vibration with graceful fallback - apply intensity
  try {
    if ('vibrate' in navigator && vibrationIntensity > 0) {
      // Scale vibration duration by intensity (200-500ms)
      const vibDuration = Math.round(200 + (300 * vibrationIntensity));
      const pauseDuration = Math.round(100 + (100 * vibrationIntensity));
      
      // Pattern: vibrate, pause, vibrate, pause, vibrate, pause
      navigator.vibrate([vibDuration, pauseDuration, vibDuration, pauseDuration, vibDuration, pauseDuration]);
      isVibrating = true;
      console.log('Speed alert vibration started with intensity:', vibrationIntensity);
      
      vibrationInterval = setInterval(() => {
        if (isVibrating && 'vibrate' in navigator) {
          navigator.vibrate([vibDuration, pauseDuration, vibDuration, pauseDuration]);
        }
      }, 2000);
    } else {
      console.log('Vibration not supported on this device or disabled');
    }
  } catch (error) {
    console.log('Error with vibration:', error);
    isVibrating = false;
  }
};

/**
 * Stop alarm sound and vibration
 * @param permanently If true, prevents alarm from triggering again until page reload
 */
export const stopAlarmSound = (permanently = false) => {
  if (!isAlarmActive) return;
  isAlarmActive = false;
  if (permanently) {
    isAlarmManuallyDisabled = true;
  }
  notifyAlarmListeners();

  // Stop sound
  try {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      console.log('Alarm sound stopped');
    }
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }

  // Clear vibration interval
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  // Stop vibration
  try {
    if ('vibrate' in navigator && isVibrating) {
      navigator.vibrate(0);
      console.log('Vibration stopped');
    }
  } catch (error) {
    console.log('Error stopping vibration:', error);
  }
  isVibrating = false;

  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
};

export { isAlarmActive, isAlarmManuallyDisabled };

/**
 * Shows a proximity notification when user is near the college
 * @param collegeName Name of the college
 */
export const showProximityNotification = (collegeName: string) => {
  // Don't show notification if alarm is manually disabled
  if (isAlarmManuallyDisabled) {
    console.log('Notification suppressed: alarm manually disabled');
    return;
  }

  // Play alarm sound and vibration
  playAlarmSound();

  try {
    const notification = showNotification(`Almost at ${collegeName}!`, {
      body: `You are within 500 meters of ${collegeName}`,
      icon: '/logo.png',
      requireInteraction: true,
      badge: '/logo.png',
      tag: 'proximity-alert', // Use tag to prevent duplicate notifications
    });
    
    // Auto-close notification when alarm stops
    if (notification) {
      const checkAlarmInterval = setInterval(() => {
        if (!isAlarmActive) {
          notification.close();
          clearInterval(checkAlarmInterval);
        }
      }, 1000);
      
      // Clean up interval if notification is closed
      notification.onclose = () => {
        clearInterval(checkAlarmInterval);
      };
    }
  } catch (error) {
    console.error('Error showing proximity notification:', error);
  }
};
