/**
 * Utility for triggering haptic feedback (vibration) on supported devices.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' | 'error' = 'light') => {
  if (!('vibrate' in navigator)) return;

  switch (type) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'medium':
      navigator.vibrate(20);
      break;
    case 'success':
      navigator.vibrate([10, 30, 10]);
      break;
    case 'warning':
      navigator.vibrate([30, 50, 30]);
      break;
    case 'error':
      navigator.vibrate([50, 100, 50, 100, 50]);
      break;
    default:
      navigator.vibrate(10);
  }
};
