import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior when app is in the foreground
try {
  if (Platform.OS !== 'web' && Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.log('Notifications handler initialization skipped:', e?.message);
}

// Day name to Expo weekday (1 = Sunday, 2 = Monday, ..., 7 = Saturday)
export const DAY_TO_WEEKDAY_MAP = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7
};

export const WEEK_DAYS_ORDER = [
  { key: 'Monday', label: 'Mon', num: 2 },
  { key: 'Tuesday', label: 'Tue', num: 3 },
  { key: 'Wednesday', label: 'Wed', num: 4 },
  { key: 'Thursday', label: 'Thu', num: 5 },
  { key: 'Friday', label: 'Fri', num: 6 },
  { key: 'Saturday', label: 'Sat', num: 7 },
  { key: 'Sunday', label: 'Sun', num: 1 }
];

export const DEFAULT_REMINDERS = {
  enabled: false,
  time: '18:00', // 24-hr format (6:00 PM)
  hour: 18,
  minute: 0,
  days: ['Monday', 'Wednesday', 'Friday'],
  soundEnabled: true
};

// Ensure Android notification channel exists
export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    if (Notifications && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('workout_reminders', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00D09E',
      });
    }
  } catch (err) {
    console.log('Failed to create Android notification channel:', err?.message);
  }
}

// Request permissions for notifications
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  try {
    if (!Notifications || !Notifications.getPermissionsAsync) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.log('Error requesting notification permissions:', err?.message);
    return false;
  }
}

// Check current permission status
export async function checkNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  try {
    if (!Notifications || !Notifications.getPermissionsAsync) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    return false;
  }
}

// Sync and schedule all workout reminders
export async function scheduleWorkoutReminders(reminderSettings) {
  if (Platform.OS === 'web') return true;

  try {
    if (!Notifications || !Notifications.cancelAllScheduledNotificationsAsync) {
      console.log('Notifications module not available natively.');
      return false;
    }

    // Cancel existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

    if (!reminderSettings || !reminderSettings.enabled) {
      return true;
    }

    // Ensure permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }

    await ensureNotificationChannel();

    const hour = parseInt(reminderSettings.hour) || 18;
    const minute = parseInt(reminderSettings.minute) || 0;
    const days = reminderSettings.days || [];

    for (const dayName of days) {
      const weekdayNum = DAY_TO_WEEKDAY_MAP[dayName];
      if (weekdayNum) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to Train! 🏋️',
            body: `Ready for today's workout? Tap to view your session and start training.`,
            sound: reminderSettings.soundEnabled ? 'default' : false,
            data: { type: 'workout_reminder', day: dayName }
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekdayNum,
            hour: hour,
            minute: minute,
            channelId: 'workout_reminders'
          }
        }).catch(err => {
          console.log(`Failed to schedule reminder for ${dayName}:`, err?.message);
        });
      }
    }

    return true;
  } catch (err) {
    console.log('Error scheduling workout reminders:', err?.message);
    return false;
  }
}

// Trigger an immediate test notification
export async function sendTestWorkoutNotification(timeStr = '18:00') {
  if (Platform.OS === 'web') {
    Alert.alert('Test Reminder', `Workout reminder would trigger at ${timeStr}. (Notifications not supported on web).`);
    return true;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable notifications permission in your device settings.');
      return false;
    }

    await ensureNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Train! 🏋️',
        body: 'This is a test workout reminder! Ready to hit your training targets today?',
        sound: 'default',
        data: { type: 'test' }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        channelId: 'workout_reminders'
      }
    }).catch(err => {
      console.log('Failed to schedule test notification:', err?.message);
    });

    Alert.alert('Test Reminder Sent!', 'You should receive the notification in a few seconds.');
    return true;
  } catch (err) {
    Alert.alert('Notification Notice', 'Test notification triggered. (If testing in simulator or client without native build, notifications appear once rebuilt).');
    return false;
  }
}
