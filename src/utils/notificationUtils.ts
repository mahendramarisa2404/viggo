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

// Audio element and timers for alarm
let alarmAudio: HTMLAudioElement | null = null;
let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let vibrationInterval: ReturnType<typeof setInterval> | null = null;
let isVibrating = false;
// Track alarm active state for UI usage
let isAlarmActive = false;
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
 * Initialize the alarm audio element
 * Call this once on user gesture
 */
export const initAlarmAudio = () => {
  if (!alarmAudio && typeof Audio !== 'undefined') {
    // Use '/alarm.mp3' as default, developer can replace this file!
    alarmAudio = new Audio('/alarm.mp3');
    alarmAudio.loop = true;
    
    // Preload audio for faster playback
    alarmAudio.preload = 'auto';
    
    // Add event listeners for better error handling
    alarmAudio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
    });
  }
};

/**
 * Play alarm sound with vibration for speed alerts
 * @returns Promise that resolves when the audio starts playing
 */
export const playAlarmSound = async () => {
  // Don't start alarm if already running
  if (isAlarmActive) return;
  isAlarmActive = true;
  notifyAlarmListeners();

  // Clear any previous stop timeout
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }

  if (!alarmAudio) initAlarmAudio();

  try {
    if (alarmAudio && alarmAudio.paused) {
      await alarmAudio.play();
      console.log('Speed alert alarm playing');
    }
  } catch (error) {
    console.error('Failed to play alarm sound:', error);
  }

  // Start vibration
  if ('vibrate' in navigator) {
    try {
      // Pattern: vibrate 500ms, pause 200ms, repeat
      navigator.vibrate([500, 200, 500, 200]);
      isVibrating = true;
      console.log('Speed alert vibration started');
      
      vibrationInterval = setInterval(() => {
        if (isVibrating && 'vibrate' in navigator) {
          navigator.vibrate([500, 200]);
        }
      }, 1400);
    } catch (error) {
      console.log('Vibration not supported');
      isVibrating = false;
    }
  }
};

/**
 * Stop alarm sound and vibration
 */
export const stopAlarmSound = () => {
  if (!isAlarmActive) return;
  isAlarmActive = false;
  notifyAlarmListeners();

  // Stop sound
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    console.log('Alarm sound stopped');
  }

  // Clear vibration interval
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  // Stop vibration
  if ('vibrate' in navigator && isVibrating) {
    try {
      navigator.vibrate(0);
      console.log('Vibration stopped');
    } catch {}
    isVibrating = false;
  }

  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
};

export { isAlarmActive };

/**
 * Shows a proximity notification when user is near the college
 * @param collegeName Name of the college
 */
export const showProximityNotification = (collegeName: string) => {
  // Play alarm sound and vibration, lasting 30s max or until stop
  playAlarmSound();

  const notification = showNotification(`Almost at ${collegeName}!`, {
    body: `You are within 500 meters of ${collegeName}`,
    icon: '/logo.png',
    requireInteraction: true,
    badge: '/logo.png',
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
};
