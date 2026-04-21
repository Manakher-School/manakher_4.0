"use client";

import { useState } from "react";
import { useLocale } from "@/context/locale-context";
import { useAuth } from "@/context/auth-context";
import { useDialog } from "@/context/dialog-context";
import pb from "@/lib/pocketbase";
import { UserCircle, Mail, Lock, AtSign, Loader2, Check } from "lucide-react";

export default function TeacherProfilePage() {
  const { dict, locale } = useLocale();
  const { user } = useAuth();
  const { alert, confirm } = useDialog();
  const t = dict.dashboard.admin.profile;

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  // Username state
  const [username, setUsername] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  if (!user) return null;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      await alert(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }
    if (newPassword.length < 8) {
      await alert(t.passwordTooShort);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      await alert(t.passwordMismatch);
      return;
    }

    const confirmed = await confirm(
      locale === "ar" ? "تأكيد تغيير كلمة المرور؟" : "Confirm password change?"
    );
    if (!confirmed) return;

    setChangingPassword(true);
    try {
      // First re-authenticate to verify current password
      await pb.collection("users").authWithPassword(user.email, currentPassword);

      // Then update the password
      await pb.collection("users").update(user.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      await alert(t.passwordChanged);
    } catch (err: any) {
      if (err?.status === 401) {
        await alert(t.incorrectPassword);
      } else {
        await alert(locale === "ar" ? "حدث خطأ أثناء تغيير كلمة المرور" : "Error changing password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      await alert(locale === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }

    const confirmed = await confirm(
      locale === "ar" ? `تأكيد تغيير البريد الإلكتروني إلى ${newEmail}؟` : `Confirm changing email to ${newEmail}?`
    );
    if (!confirmed) return;

    setChangingEmail(true);
    try {
      // Re-authenticate to verify password
      await pb.collection("users").authWithPassword(user.email, emailPassword);

      // Update email
      await pb.collection("users").update(user.id, {
        email: newEmail,
      });

      setNewEmail("");
      setEmailPassword("");
      await alert(t.emailChanged);

      // Refresh auth to get updated user data
      const refreshed = await pb.collection("users").authRefresh();
      if (refreshed?.record) {
        // Update the cookie with new auth data via server-side API route
        try {
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record }),
          });
        } catch {
          // Fallback to document.cookie
          if (typeof document !== "undefined") {
            const cookieValue = JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record });
            document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          }
        }
      }
    } catch (err: any) {
      if (err?.status === 401) {
        await alert(t.incorrectPassword);
      } else {
        const msg = err?.response?.data?.email?.message || err?.message || String(err);
        await alert(locale === "ar" ? `خطأ: ${msg}` : `Error: ${msg}`);
      }
    } finally {
      setChangingEmail(false);
    }
  };

  const handleSetUsername = async () => {
    if (!username.trim()) {
      await alert(locale === "ar" ? "يرجى إدخال اسم المستخدم" : "Please enter a username");
      return;
    }
    if (username.length < 3 || username.length > 30) {
      await alert(t.usernameHint);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      await alert(t.usernameHint);
      return;
    }

    setSavingUsername(true);
    try {
      await pb.collection("users").update(user.id, {
        username: username.trim(),
      });
      await alert(t.usernameSet);

      // Refresh auth to get updated user data
      const refreshed = await pb.collection("users").authRefresh();
      if (refreshed?.record) {
        try {
          await fetch("/api/auth/set-cookie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record }),
          });
        } catch {
          if (typeof document !== "undefined") {
            const cookieValue = JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record });
            document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          }
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.username?.message || err?.message || String(err);
      await alert(locale === "ar" ? `خطأ: ${msg}` : `Error: ${msg}`);
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">{t.title}</h1>
        <p className="text-sm text-[var(--color-ink-secondary)] mt-1">{t.subtitle}</p>
      </div>

      {/* Current Account Info */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-role-teacher-bg)] flex items-center justify-center">
            <UserCircle className="h-8 w-8 text-[var(--color-role-teacher-bold)]" />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--color-ink)]">
              {locale === "ar" ? user.name_ar : user.name_en}
            </h2>
            <p className="text-sm text-[var(--color-ink-secondary)]">{user.email}</p>
            {user.username && (
              <p className="text-xs text-[var(--color-ink-placeholder)]">@{user.username}</p>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-[var(--color-role-teacher-bold)]" />
          <h3 className="font-semibold text-[var(--color-ink)]">{t.changePassword}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder={t.currentPasswordLabel}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder={t.newPasswordLabel}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder={t.confirmPasswordLabel}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-role-teacher-bold)] px-4 py-2 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {t.changePassword}
          </button>
        </div>
      </div>

      {/* Change Email */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-[var(--color-role-teacher-bold)]" />
          <h3 className="font-semibold text-[var(--color-ink)]">{t.changeEmail}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.currentEmail}
            </label>
            <p className="text-sm text-[var(--color-ink)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] px-3 py-2 border border-[var(--color-border)]">
              {user.email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.newEmail}
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder={t.newEmailLabel}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.currentPassword}
            </label>
            <input
              type="password"
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder={t.currentPasswordLabel}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <button
            onClick={handleChangeEmail}
            disabled={changingEmail}
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-role-teacher-bold)] px-4 py-2 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {changingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {t.changeEmail}
          </button>
        </div>
      </div>

      {/* Set Username */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <AtSign className="h-5 w-5 text-[var(--color-role-teacher-bold)]" />
          <h3 className="font-semibold text-[var(--color-ink)]">{t.setUsername}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-1.5">
              {t.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder={t.usernameLabel}
              maxLength={30}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-ink-placeholder)] mt-1">{t.usernameHint}</p>
          </div>
          <button
            onClick={handleSetUsername}
            disabled={savingUsername}
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-role-teacher-bold)] px-4 py-2 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}