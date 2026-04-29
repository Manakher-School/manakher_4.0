"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { getPocketBase } from "@/lib/pocketbase";
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendNotification,
} from "@/lib/notifications";

interface NotificationContextValue {
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue>({
  permissionGranted: false,
  requestPermission: async () => false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check current permission status on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  // Set up PocketBase real-time subscriptions for notifications
  useEffect(() => {
    if (!user || !permissionGranted) return;

    const pb = getPocketBase();
    const sections: string[] = (user as any).sections ?? [];
    const role = (user as any).role;

    // Build section filter for subscriptions
    const sectionFilter =
      sections.length > 0
        ? sections.map((id) => `section = "${id}"`).join(" || ")
        : "";

    const unsubs: (() => void)[] = [];

    // Subscribe to new announcements
    pb.collection("announcements").subscribe("*", (e) => {
      if (e.action !== "create") return;
      const record = e.record as any;
      
      // Don't notify about own posts
      if (record.author === user.id) return;

      // Check if this announcement is relevant to the user
      if (record.scope === "global" || (sectionFilter && sections.includes(record.section))) {
        sendNotification(
          role === "ar" ? "إعلان جديد" : "New Announcement",
          { body: record.title || "", tag: `announcement-${record.id}` }
        );
      }
    }).then((unsub) => { unsubs.push(unsub); });

    // Subscribe to new materials (for students)
    if (role === "student" && sectionFilter) {
      pb.collection("materials").subscribe("*", (e) => {
        if (e.action !== "create") return;
        const record = e.record as any;
        if (!sections.includes(record.section)) return;

        sendNotification(
          role === "ar" ? "مادة تعليمية جديدة" : "New Learning Material",
          { body: record.title || "", tag: `material-${record.id}` }
        );
      }).then((unsub) => { unsubs.push(unsub); });
    }

    // Subscribe to new homework (for students)
    if (role === "student" && sectionFilter) {
      pb.collection("homework").subscribe("*", (e) => {
        if (e.action !== "create") return;
        const record = e.record as any;
        if (!sections.includes(record.section)) return;

        sendNotification(
          role === "ar" ? "واجب جديد" : "New Homework",
          { body: record.title || "", tag: `homework-${record.id}` }
        );
      }).then((unsub) => { unsubs.push(unsub); });
    }

    // Subscribe to submission grading (for students)
    if (role === "student") {
      pb.collection("submissions").subscribe("*", (e) => {
        if (e.action !== "update") return;
        const record = e.record as any;
        if (record.student !== user.id) return;
        if (record.status !== "graded") return;

        sendNotification(
          role === "ar" ? "تم تقييم واجبك" : "Your homework was graded",
          {
            body: record.grade !== null ? `Grade: ${record.grade}/100` : "",
            tag: `graded-${record.id}`,
          }
        );
      }).then((unsub) => { unsubs.push(unsub); });
    }

    // Subscribe to new submissions (for teachers)
    if (role === "teacher") {
      pb.collection("submissions").subscribe("*", (e) => {
        if (e.action !== "create") return;

        sendNotification(
          "New Submission",
          { tag: `submission-${(e.record as any).id}` }
        );
      }).then((unsub) => { unsubs.push(unsub); });
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, permissionGranted]);

  return (
    <NotificationContext.Provider value={{ permissionGranted, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}