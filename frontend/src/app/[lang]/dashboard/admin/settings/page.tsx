"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { dict, locale } = useLocale();
  const { alert } = useDialog();
  const t = dict.dashboard.admin.settings;
  const common = dict.common;

  // Settings state
  const [schoolNameAr, setSchoolNameAr] = useState("مدرسة مناخر الاساسية المؤنثة");
  const [schoolNameEn, setSchoolNameEn] = useState("Manakher Basic Girls' School");
  const [enableComments, setEnableComments] = useState(true);
  const [enableReactions, setEnableReactions] = useState(true);
  const [enableQuizzes, setEnableQuizzes] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load settings from PocketBase on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const pb = getPocketBase();
      const records = await pb.collection("platform_settings").getFullList();
      
      records.forEach(record => {
        if (record.key === "school_info" && record.value) {
          setSchoolNameAr(record.value.schoolNameAr || "مدرسة مناخر الاساسية المؤنثة");
          setSchoolNameEn(record.value.schoolNameEn || "Manakher Basic Girls' School");
          setEnableComments(record.value.enableComments !== false);
          setEnableReactions(record.value.enableReactions !== false);
          setEnableQuizzes(record.value.enableQuizzes !== false);
        }
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
      // Fallback to defaults
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    
    try {
      const pb = getPocketBase();
      const settingsData = {
        schoolNameAr,
        schoolNameEn,
        enableComments,
        enableReactions,
        enableQuizzes,
      };

      // Try to update existing record
      try {
        const records = await pb.collection("platform_settings").getFullList({
          filter: `key = "school_info"`,
        });
        
        if (records.length > 0) {
          // Update existing
          await pb.collection("platform_settings").update(records[0].id, {
            value: settingsData,
          });
        } else {
          // Create new
          await pb.collection("platform_settings").create({
            key: "school_info",
            value: settingsData,
          });
        }
      } catch (e) {
        // If no records found, create new
        await pb.collection("platform_settings").create({
          key: "school_info",
          value: settingsData,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
     } catch (e) {
       console.error("Failed to save settings:", e);
       await alert("Failed to save settings. Please try again.");
     } finally {
       setSaving(false);
     }
   }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
          {t.title}
        </h2>
        <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{t.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : (
        <>
          {/* General Settings */}
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
            style={{ background: "var(--color-role-admin-bg)", color: "var(--color-role-admin-bold)" }}
          >
            <SettingsIcon className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-ink)]">{t.general}</h3>
        </div>

        <div className="space-y-4">
          <Input
            label={t.schoolNameAr}
            value={schoolNameAr}
            onChange={(e) => setSchoolNameAr(e.target.value)}
            placeholder={t.schoolNameAr}
          />
          <Input
            label={t.schoolNameEn}
            value={schoolNameEn}
            onChange={(e) => setSchoolNameEn(e.target.value)}
            placeholder={t.schoolNameEn}
          />
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
            style={{ background: "var(--color-role-admin-bg)", color: "var(--color-role-admin-bold)" }}
          >
            <Check className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-ink)]">{t.features}</h3>
        </div>

        <div className="space-y-4">
          {/* Enable Comments */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableComments}
              onChange={(e) => setEnableComments(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableComments}</p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.commentsDesc}</p>
            </div>
          </label>

          {/* Enable Reactions */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableReactions}
              onChange={(e) => setEnableReactions(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableReactions}</p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.reactionsDesc}</p>
            </div>
          </label>

          {/* Enable Quizzes */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableQuizzes}
              onChange={(e) => setEnableQuizzes(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{t.enableQuizzes}</p>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{t.quizzesDesc}</p>
            </div>
          </label>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-[var(--radius-lg)] bg-blue-50 border border-blue-200 px-4 py-3">
        <p className="text-xs text-blue-900">{t.note}</p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? common.loading : t.saveChanges}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
            <Check className="h-4 w-4" />
            {t.saved}
          </span>
        )}
      </div>
        </>
      )}
    </div>
  );
}
