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
 * Play alarm sound
 * @returns Promise that resolves when the audio starts playing
 */
export const playAlarmSound = async () => {
  if (!alarmAudio) {
    initAlarmAudio();
  }
  
  try {
    if (alarmAudio && alarmAudio.paused) {
      // Use await to handle the play promise
      await alarmAudio.play();
      console.log('Alarm sound playing');
    }
  } catch (error) {
    console.error('Failed to play alarm sound:', error);
  }
};

/**
 * Stop alarm sound
 */
export const stopAlarmSound = () => {
  if (alarmAudio && !alarmAudio.paused) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    console.log('Alarm sound stopped');
  }
};

/**
 * Shows a proximity notification when user is near the college
 * @param collegeName Name of the college
 */
export const showProximityNotification = (collegeName: string) => {
  // Play alarm sound when near college
  playAlarmSound();
  
  showNotification(`Almost at ${collegeName}!`, {
    body: `You are within 500 meters of ${collegeName}`,
    icon: '/logo.png',
    // Attempt to make the notification vibrate the device
    vibrate: [200, 100, 200],
    // Try to keep the notification persistent
    requireInteraction: true,
  });
};
