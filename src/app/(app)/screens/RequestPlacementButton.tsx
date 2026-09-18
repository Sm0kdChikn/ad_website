"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CreativeOpt = { id: string; name: string; status: string };

export function RequestPlacementButton({
  screenId,
  disabled,
}: {
  screenId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creatives, setCreatives] = useState<CreativeOpt[]>([]);
  const [creativeId, setCreativeId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      const res = await fetch("/api/creatives");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const approved = (data.creatives || []).filter(
          (c: CreativeOpt) => c.status === "APPROVED"
        );
        setCreatives(approved);
        if (approved.length === 1) setCreativeId(approved[0].id);
      }
      setLoaded(true);
    })();
  }, [open, loaded]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!creativeId) {
      setError("Select an APPROVED creative");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenId,
        creativeId,
        note: note.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    setOpen(false);
    router.push("/placements");
    router.refresh();
  }

  if (disabled) {
    return (
      <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
        Unavailable
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Request placement
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-xs space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"
    >
      <label className="block text-xs font-medium text-slate-700">
        APPROVED creative
        <select
          value={creativeId}
          onChange={(e) => setCreativeId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          required
        >
          <option value="">Select…</option>
          {creatives.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {loaded && creatives.length === 0 && (
        <p className="text-xs text-amber-800">
          No APPROVED creatives. Upload and get one approved first.
        </p>
      )}
      <label className="block text-xs font-medium text-slate-700">
        Note (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="Preferred dates, message…"
        />
      </label>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || creatives.length === 0}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Submit request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
