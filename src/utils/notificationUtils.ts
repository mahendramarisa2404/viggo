
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

// Audio element for playing alarm sounds
let alarmAudio: HTMLAudioElement | null = null;
// Timer for stopping alarm after 60 seconds
let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
// Track if vibration is ongoing (for manual stop)
let isVibrating = false;

/**
 * Initialize the alarm audio element
 */
export const initAlarmAudio = () => {
  if (!alarmAudio && typeof Audio !== 'undefined') {
    alarmAudio = new Audio('/alarm.mp3');
    alarmAudio.loop = true;
  }
};

/**
 * Play alarm sound (and optionally vibration)
 * @returns Promise that resolves when the audio starts playing
 */
export const playAlarmSound = async () => {
  // Clear any previous alarm timeout
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }

  if (!alarmAudio) {
    initAlarmAudio();
  }

  try {
    if (alarmAudio && alarmAudio.paused) {
      await alarmAudio.play();
      console.log('Alarm sound playing');
    }
  } catch (error) {
    console.error('Failed to play alarm sound:', error);
  }

  // Vibrate the device if possible
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 100, 200, 100]); // vibrate in pattern
      isVibrating = true;
      console.log('Device vibration triggered');
    } catch (error) {
      isVibrating = false;
      console.log('Vibration not supported on this device');
    }
  }

  // Set timer for 60 seconds to auto-stop alarm
  alarmTimeout = setTimeout(() => {
    stopAlarmSound();
  }, 60 * 1000); // 60 seconds
};

/**
 * Stop alarm sound and vibration
 */
export const stopAlarmSound = () => {
  if (alarmAudio && !alarmAudio.paused) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    console.log('Alarm sound stopped');
  }

  // Stop vibration
  if ('vibrate' in navigator && isVibrating) {
    try {
      navigator.vibrate(0); // Cancel ongoing vibration
      console.log('Vibration stopped');
    } catch (error) {
      // ignore
    }
    isVibrating = false;
  }

  // Clear any pending alarm auto-stop timeout
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
};

/**
 * Shows a proximity notification when user is near the college
 * @param collegeName Name of the college
 */
export const showProximityNotification = (collegeName: string) => {
  // Play alarm sound (will also start auto-stop timer)
  playAlarmSound();

  // Create notification with compatible options
  showNotification(`Almost at ${collegeName}!`, {
    body: `You are within 500 meters of ${collegeName}`,
    icon: '/logo.png',
    requireInteraction: true,
  });

  // Attempt to vibrate the device if the API is available
  // This will run in addition to vibration triggered from playAlarmSound,
  // but browsers will typically merge them.
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
      isVibrating = true;
      console.log('Device vibration triggered');
    } catch (error) {
      isVibrating = false;
      console.log('Vibration not supported on this device');
    }
  }
};
