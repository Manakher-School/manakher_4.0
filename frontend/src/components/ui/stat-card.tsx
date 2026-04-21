import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  colorSlot?: 1 | 2 | 3 | 4;
  clickable?: boolean;
}

const slotStyles: Record<number, { bg: string; icon: string }> = {
  1: { bg: "bg-[var(--color-stat-1-bg)]", icon: "text-[var(--color-stat-1-icon)]" },
  2: { bg: "bg-[var(--color-stat-2-bg)]", icon: "text-[var(--color-stat-2-icon)]" },
  3: { bg: "bg-[var(--color-stat-3-bg)]", icon: "text-[var(--color-stat-3-icon)]" },
  4: { bg: "bg-[var(--color-stat-4-bg)]", icon: "text-[var(--color-stat-4-icon)]" },
};

const isEmpty = (v: string | number) => v === "—" || v === "" || v === null || v === undefined;

// Map colorSlot to a gentle hover background tint
const slotHoverBg: Record<number, string> = {
  1: "hover:bg-[#eff6ff]", // light blue tint
  2: "hover:bg-[#f0fdf4]", // light green tint
  3: "hover:bg-[#fdf2f8]", // light pink tint
  4: "hover:bg-[#fefce8]", // light yellow tint
};

export function StatCard({ icon, label, value, colorSlot, clickable }: StatCardProps) {
  const explicit = colorSlot ? slotStyles[colorSlot] : null;
  const empty = isEmpty(value);
  const hoverBg = colorSlot ? slotHoverBg[colorSlot] : "hover:bg-[var(--color-surface-hover)]";

  return (
    <div
      className={[
        "relative bg-[var(--color-surface-card)] border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 flex flex-col gap-4 transition-all duration-200",
        clickable
          ? `cursor-pointer border-[var(--color-border)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--color-accent)] ${hoverBg}`
          : `border-[var(--color-border)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${hoverBg}`,
      ].join(" ")}
    >
      {/* Navigation indicator for clickable cards */}
      {clickable && (
        <span className="absolute top-4 end-4 text-[var(--color-ink-disabled)] transition-colors group-hover:text-[var(--color-accent)]">
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      )}

      {/* Icon */}
      <span
        className={`stat-icon flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] ${explicit ? `${explicit.bg} ${explicit.icon}` : ""}`}
      >
        <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      </span>

      {/* Value */}
      <div>
        {empty ? (
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-[var(--color-ink-disabled)] leading-none">—</span>
          </div>
        ) : (
          <p className="text-3xl font-black text-[var(--color-ink)] leading-none tracking-tight">
            {value}
          </p>
        )}
        <p className="mt-1.5 text-sm text-[var(--color-ink-secondary)] font-semibold">
          {label}
        </p>
      </div>
    </div>
  );
}
