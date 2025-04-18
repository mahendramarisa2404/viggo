
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

/**
 * Shows a proximity notification when user is near the college
 * @param collegeName Name of the college
 */
export const showProximityNotification = (collegeName: string) => {
  showNotification(`Almost at ${collegeName}!`, {
    body: `You are within 500 meters of ${collegeName}`,
    icon: '/logo.png',
  });
};
