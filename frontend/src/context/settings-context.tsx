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
  schoolNameAr: "مدرسة مناخر الاساسية",
  schoolNameEn: "Manakher Basic School",
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
      
      // Add a timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const records = await pb.collection("platform_settings").getFullList({
          filter: `key = "school_info"`,
        });

        clearTimeout(timeout);

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
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (e) {
      // Log error but don't crash - use default settings
      console.warn("Failed to load settings from PocketBase, using defaults:", e);
      // Settings already initialized with DEFAULT_SETTINGS, so this is safe
    } finally {
      setIsLoading(false);
    }
  }

  const updateSettings = useCallback(
    async (newSettings: Partial<PlatformSettings>) => {
      const pb = getPocketBase();

      try {
        // Get current settings to merge with new ones (don't use stale closure)
        const currentSettings = settings;
        const settingsData = {
          ...currentSettings,
          ...newSettings,
        };

        // First, update local state immediately for optimistic update
        setSettings(settingsData);

        // Then persist to PocketBase
        try {
          const records = await pb.collection("platform_settings").getFullList({
            filter: `key = "school_info"`,
          });

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
        } catch (pbError) {
          console.warn("Failed to persist settings to PocketBase:", pbError);
          // Don't throw - keep local state updated even if server fails
          // This allows the app to continue working with local settings
        }
      } catch (e) {
        console.error("Failed to update settings:", e);
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
