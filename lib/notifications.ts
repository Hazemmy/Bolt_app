import { Platform } from 'react-native';
import { Medicine, ActiveMedication } from '@/context/storage';

type NotifModule = typeof import('expo-notifications');

let notifModule: NotifModule | null = null;
let nativeImportAttempted = false;

async function getNotifModule(): Promise<NotifModule | null> {
  if (Platform.OS === 'web') return null;
  if (nativeImportAttempted) return notifModule;
  nativeImportAttempted = true;
  try {
    notifModule = await import('expo-notifications');
  } catch {
    notifModule = null;
  }
  return notifModule;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  const mod = await getNotifModule();
  if (!mod) return false;

  try {
    const settings = await mod.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === mod.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const requested = await mod.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return (
      requested.granted ||
      requested.ios?.status === mod.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export function canSendNotifications(): boolean {
  // Synchronous check is only meaningful on web; on native we rely on the async permission flow.
  if (Platform.OS === 'web') {
    return 'Notification' in window && Notification.permission === 'granted';
  }
  return true;
}

async function sendNativeNotification(
  title: string,
  body: string,
  tag: string,
  triggerMs: number | null
): Promise<void> {
  const mod = await getNotifModule();
  if (!mod) return;

  try {
    if (triggerMs === null) {
      await mod.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } else {
      await mod.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(triggerMs / 1000)) },
      });
    }
  } catch {
    /* ignore */
  }
}

function sendWebNotification(
  title: string,
  body: string,
  tag: string,
  triggerMs: number | null
): void {
  if (Platform.OS !== 'web' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const fire = () =>
    new Notification(title, {
      body,
      icon: '/assets/images/icon.png',
      tag,
      requireInteraction: true,
    });

  if (triggerMs === null) {
    fire();
  } else {
    setTimeout(fire, triggerMs);
  }
}

export function sendMedicineReminder(
  medicineName: string,
  time: string,
  dosage?: string
): void {
  const timeFormatted = formatTimeForDisplay(time);
  const title = `Time for ${medicineName}`;
  const body = dosage
    ? `${timeFormatted} - ${dosage}`
    : `${timeFormatted} - Don't forget to take your medicine`;

  if (Platform.OS === 'web') {
    sendWebNotification(title, body, `medicine-${medicineName}-${time}`, null);
  } else {
    void sendNativeNotification(title, body, `medicine-${medicineName}-${time}`, null);
  }
}

export function sendExpiredNotification(medicineName: string): void {
  const title = `${medicineName} has expired`;
  const body = 'This medicine should be replaced or removed from your inventory.';

  if (Platform.OS === 'web') {
    sendWebNotification(title, body, `expired-${medicineName}`, null);
  } else {
    void sendNativeNotification(title, body, `expired-${medicineName}`, null);
  }
}

export function sendExpiringSoonNotification(medicineName: string, daysLeft: number): void {
  const timeText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  const title = `${medicineName} expires ${timeText}`;
  const body = 'Check your medicine cabinet and consider getting a refill.';

  if (Platform.OS === 'web') {
    sendWebNotification(title, body, `expiring-${medicineName}`, null);
  } else {
    void sendNativeNotification(title, body, `expiring-${medicineName}`, null);
  }
}

export async function scheduleDailyReminders(
  activeMedications: ActiveMedication[],
  getMedicineName: (id: string) => string
): Promise<void> {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const reminders: Array<{ title: string; body: string; tag: string; triggerMs: number }> = [];

  activeMedications.forEach((med) => {
    const medName = getMedicineName(med.medicine_id);
    med.times_of_day.forEach((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const medMinutes = hours * 60 + minutes;
      const diff = medMinutes - currentTime;
      if (diff > 0 && diff <= 30) {
        reminders.push({
          title: `Time for ${medName}`,
          body: `${formatTimeForDisplay(time)} - ${med.dosage ?? "Don't forget to take your medicine"}`,
          tag: `medicine-${medName}-${time}`,
          triggerMs: diff * 60 * 1000,
        });
      }
    });
  });

  if (reminders.length === 0) return;

  if (Platform.OS === 'web') {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    reminders.forEach((r) => sendWebNotification(r.title, r.body, r.tag, r.triggerMs));
  } else {
    const mod = await getNotifModule();
    if (!mod) return;
    for (const r of reminders) {
      await sendNativeNotification(r.title, r.body, r.tag, r.triggerMs);
    }
  }
}

export async function checkExpiryNotifications(
  medicines: Medicine[],
  notifyExpired: boolean,
  notifyExpiring: boolean
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredToSend: string[] = [];
  const expiringToSend: Array<{ name: string; days: number }> = [];

  medicines.forEach((med) => {
    const target = new Date(med.expiration_date + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (notifyExpired && diff < 0) {
      expiredToSend.push(med.name);
    } else if (notifyExpiring && diff >= 0 && diff <= 30) {
      expiringToSend.push({ name: med.name, days: diff });
    }
  });

  if (expiredToSend.length === 0 && expiringToSend.length === 0) return;

  if (Platform.OS === 'web') {
    if (!canSendNotifications()) return;
    expiredToSend.forEach((name) => sendExpiredNotification(name));
    expiringToSend.forEach((item) => sendExpiringSoonNotification(item.name, item.days));
  } else {
    for (const name of expiredToSend) {
      sendExpiredNotification(name);
    }
    for (const item of expiringToSend) {
      sendExpiringSoonNotification(item.name, item.days);
    }
  }
}

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getNextReminderTime(
  activeMedications: ActiveMedication[]
): string | null {
  if (activeMedications.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nextTime: string | null = null;
  let minDiff = Infinity;

  activeMedications.forEach((med) => {
    med.times_of_day.forEach((time) => {
      const [h, m] = time.split(':').map(Number);
      const medMinutes = h * 60 + m;

      let diff = medMinutes - currentMinutes;
      if (diff < 0) diff += 24 * 60;

      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextTime = time;
      }
    });
  });

  return nextTime ? formatTimeForDisplay(nextTime) : null;
}
