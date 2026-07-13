import { Platform } from 'react-native';
import { Medicine, ActiveMedication } from '@/context/storage';

// Helper to format time

// Check if notifications are supported and permitted
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'web' || !('Notification' in window)) {
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
}

export function canSendNotifications(): boolean {
  if (Platform.OS !== 'web' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

// Send notification for medicine reminder
export function sendMedicineReminder(
  medicineName: string,
  time: string,
  dosage?: string
): void {
  if (!canSendNotifications()) return;

  const timeFormatted = formatTimeForDisplay(time);
  const title = `Time for ${medicineName}`;
  const body = dosage
    ? `${timeFormatted} - ${dosage}`
    : `${timeFormatted} - Don't forget to take your medicine`;

  new Notification(title, {
    body,
    icon: '/assets/images/icon.png',
    tag: `medicine-${medicineName}-${time}`,
    requireInteraction: true,
  });
}

// Send notification for expired medicine
export function sendExpiredNotification(medicineName: string): void {
  if (!canSendNotifications()) return;

  new Notification(`${medicineName} has expired`, {
    body: 'This medicine should be replaced or removed from your inventory.',
    icon: '/assets/images/icon.png',
    tag: `expired-${medicineName}`,
    requireInteraction: true,
  });
}

// Send notification for expiring soon medicine
export function sendExpiringSoonNotification(medicineName: string, daysLeft: number): void {
  if (!canSendNotifications()) return;

  const timeText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  new Notification(`${medicineName} expires ${timeText}`, {
    body: "Check your medicine cabinet and consider getting a refill.",
    icon: '/assets/images/icon.png',
    tag: `expiring-${medicineName}`,
  });
}

// Schedule daily medicine reminders
export function scheduleDailyReminders(
  activeMedications: ActiveMedication[],
  getMedicineName: (id: string) => string
): void {
  if (!canSendNotifications()) return;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  activeMedications.forEach((med) => {
    const medName = getMedicineName(med.medicine_id);
    med.times_of_day.forEach((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const medMinutes = hours * 60 + minutes;

      // If the time is coming up in the next 30 minutes, schedule a reminder
      const diff = medMinutes - currentTime;
      if (diff > 0 && diff <= 30) {
        setTimeout(() => {
          sendMedicineReminder(medName, time, med.dosage);
        }, diff * 60 * 1000);
      }
    });
  });
}

// Check for expired/expiring medicines and notify
export function checkExpiryNotifications(
  medicines: Medicine[],
  notifyExpired: boolean,
  notifyExpiring: boolean
): void {
  if (!canSendNotifications()) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  medicines.forEach((med) => {
    const target = new Date(med.expiration_date + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (notifyExpired && diff < 0) {
      sendExpiredNotification(med.name);
    } else if (notifyExpiring && diff >= 0 && diff <= 30) {
      sendExpiringSoonNotification(med.name, diff);
    }
  });
}

function formatTimeForDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Get next reminder time for display
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

      // Find the next occurrence today
      let diff = medMinutes - currentMinutes;
      // If already passed today, check tomorrow
      if (diff < 0) diff += 24 * 60;

      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextTime = time;
      }
    });
  });

  return nextTime ? formatTimeForDisplay(nextTime) : null;
}
