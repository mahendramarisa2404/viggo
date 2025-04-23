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
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
};

// Audio element and timers for alarm
let alarmAudio: HTMLAudioElement | null = null;
let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let isVibrating = false;
// NEW: Track alarm active state for UI usage
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
  }
};

/**
 * Play alarm sound (and optionally vibration)
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
      console.log('Alarm sound playing');
    }
  } catch (error) {
    console.error('Failed to play alarm sound:', error);
  }

  // Vibrate device in a pleasant sequence
  if ('vibrate' in navigator) {
    try {
      // pleasant repeated pulses: 5 times for 60 seconds with spacing
      navigator.vibrate([
        400, 400, 400, 700, 400, 700, 400, 700, 400, 700
      ]);
      isVibrating = true;
      console.log('Device vibration triggered');
    } catch (error) {
      isVibrating = false;
      console.log('Vibration not supported on this device');
    }
  }

  // Stop alarm after 60 seconds automatically
  alarmTimeout = setTimeout(() => {
    stopAlarmSound();
  }, 60 * 1000); // 60 seconds
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
  // Play alarm sound and vibration, lasting 60s max or until stop
  playAlarmSound();

  showNotification(`Almost at ${collegeName}!`, {
    body: `You are within 500 meters of ${collegeName}`,
    icon: '/logo.png',
    requireInteraction: true,
  });

  // Extra vibration (some browsers merge with above)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400]);
      isVibrating = true;
      console.log('Device vibration triggered');
    } catch (error) {
      isVibrating = false;
      console.log('Vibration not supported on this device');
    }
  }
};
