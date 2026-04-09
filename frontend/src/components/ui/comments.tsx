"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useDialog } from "@/context/dialog-context";
import { getPocketBase } from "@/lib/pocketbase";
import { Button } from "./button";
import { Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string; // This is the ID, expanded author is in expand.author
  created: string;
  expand?: {
    author?: {
      id: string;
      name_ar: string;
      name_en: string;
      email: string;
    };
  };
}

interface CommentsProps {
  targetType: "announcement" | "material";
  targetId: string;
}

export function Comments({ targetType, targetId }: CommentsProps) {
  const { user } = useAuth();
  const { dict, locale } = useLocale();
  const { confirm } = useDialog();
  const t = dict.common.comments;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pb = getPocketBase();

  const loadComments = async () => {
    try {
      setLoading(true);
      const records = await pb.collection("comments").getList<Comment>(1, 50, {
        filter: `target_type = "${targetType}" && target_id = "${targetId}"`,
        expand: "author",
        sort: "-created",
      });
      
      setComments(records.items);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      await pb.collection("comments").create({
        content: newComment.trim(),
        author: user.id,
        target_type: targetType,
        target_id: targetId,
      });
      
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!(await confirm(t.confirmDelete))) return;
    
    try {
      await pb.collection("comments").delete(commentId);
      await loadComments();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return t.minutesAgo.replace("{n}", diffMins.toString());
    if (diffHours < 24) return t.hoursAgo.replace("{n}", diffHours.toString());
    if (diffDays < 7) return t.daysAgo.replace("{n}", diffDays.toString());
    
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-[var(--color-border)]">
      <h3 className="text-lg font-bold text-[var(--color-ink)]">
        {t.title} ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t.placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!newComment.trim() || submitting}>
            {submitting ? t.posting : t.postComment}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-[var(--color-ink-secondary)]">
          {t.loading}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-ink-secondary)]">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const authorData = comment.expand?.author;
            const authorName = authorData
              ? (locale === "ar" 
                  ? authorData.name_ar || authorData.name_en || authorData.email
                  : authorData.name_en || authorData.name_ar || authorData.email)
              : (locale === "ar" ? "مستخدم" : "User");
            
            return (
              <div
                key={comment.id}
                className="bg-[var(--color-surface-card)] rounded-lg p-4 border border-[var(--color-border)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {authorName}
                      </span>
                      <span className="text-sm text-[var(--color-ink-secondary)]">
                        {formatDate(comment.created)}
                      </span>
                    </div>
                    <p className="text-[var(--color-ink)] whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  {user?.id === comment.author && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="text-[var(--color-status-danger-text)] hover:bg-[var(--color-status-danger-bg)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
