/**
 * Browser Notification Utility
 * 
 * Provides a simple API for requesting notification permission
 * and sending browser notifications when the app is open.
 * 
 * Uses the Web Notification API for desktop notifications.
 * For mobile push notifications, a service worker + push server would be needed.
 */

const NOTIFICATION_PERMISSION_KEY = "manakher_notification_permission_requested";

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 * Returns true if permission was granted, false otherwise.
 * Only asks once per session (tracked in localStorage).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  // Don't ask again if we've already asked
  const alreadyAsked = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  if (alreadyAsked) return Notification.permission === "granted";

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, "true");
    return permission === "granted";
  } catch {
    return false;
  }
}

/**
 * Send a browser notification.
 * Only sends if permission is granted and the document is visible (app is open).
 * 
 * @param title - Notification title
 * @param options - Notification options (body, icon, tag, etc.)
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus the window when the notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Silently fail if notification creation fails
  }
}

/**
 * Notification helper functions for specific events
 */

export function notifyNewAnnouncement(title: string, authorName: string): void {
  sendNotification(
    authorName 
      ? `${authorName}: ${title}`
      : title,
    {
      body: authorName ? undefined : undefined,
      tag: "announcement",
    }
  );
}

export function notifyNewMaterial(title: string, authorName: string): void {
  sendNotification(
    `${authorName}: ${title}`,
    {
      tag: "material",
    }
  );
}

export function notifyNewHomework(title: string, authorName: string): void {
  sendNotification(
    `${authorName}: ${title}`,
    {
      tag: "homework",
    }
  );
}

export function notifyNewExam(title: string): void {
  sendNotification(
    title,
    {
      tag: "exam",
    }
  );
}

export function notifyNewQuiz(title: string): void {
  sendNotification(
    title,
    {
      tag: "quiz",
    }
  );
}

export function notifyHomeworkGraded(title: string, grade: number): void {
  sendNotification(
    title,
    {
      body: `Grade: ${grade}/100`,
      tag: "graded",
    }
  );
}