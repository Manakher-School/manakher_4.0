"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getPocketBase } from "@/lib/pocketbase";

interface PlatformSettings {
  schoolNameAr: string;
  schoolNameEn: string;
  enableComments: boolean;
  enableReactions: boolean;
  enableQuizzes: boolean;
}

interface SettingsContextType {
  settings: PlatformSettings;
  updateSettings: (newSettings: Partial<PlatformSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: PlatformSettings = {
  schoolNameAr: "مدرسة مناخر الاساسية المؤنثة",
  schoolNameEn: "Manakher Basic Girls' School",
  enableComments: true,
  enableReactions: true,
  enableQuizzes: true,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from PocketBase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const pb = getPocketBase();
      const records = await pb.collection("platform_settings").getFullList({
        filter: `key = "school_info"`,
      });

      if (records.length > 0 && records[0].value) {
        setSettings((prev) => ({
          ...prev,
          schoolNameAr: records[0].value.schoolNameAr || prev.schoolNameAr,
          schoolNameEn: records[0].value.schoolNameEn || prev.schoolNameEn,
          enableComments:
            records[0].value.enableComments !== false,
          enableReactions:
            records[0].value.enableReactions !== false,
          enableQuizzes:
            records[0].value.enableQuizzes !== false,
        }));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  }

  const updateSettings = useCallback(
    async (newSettings: Partial<PlatformSettings>) => {
      const pb = getPocketBase();

      try {
        // First, update local state immediately for optimistic update
        setSettings((prev) => ({
          ...prev,
          ...newSettings,
        }));

        // Then persist to PocketBase
        const records = await pb.collection("platform_settings").getFullList({
          filter: `key = "school_info"`,
        });

        const settingsData = {
          ...settings,
          ...newSettings,
        };

        if (records.length > 0) {
          // Update existing record
          await pb.collection("platform_settings").update(records[0].id, {
            value: settingsData,
          });
        } else {
          // Create new record
          await pb.collection("platform_settings").create({
            key: "school_info",
            value: settingsData,
          });
        }
      } catch (e) {
        console.error("Failed to update settings:", e);
        // Revert local state on error
        await loadSettings();
        throw e;
      }
    },
    [settings]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
