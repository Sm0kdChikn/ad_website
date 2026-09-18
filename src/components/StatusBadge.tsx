import type { CreativeStatus } from "@/lib/types";

const styles: Record<CreativeStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: string }) {
  const s = (styles[status as CreativeStatus] || styles.DRAFT);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${s}`}>
      {status}
    </span>
  );
}
