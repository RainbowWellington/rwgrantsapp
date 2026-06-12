import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getFundingRounds,
  createFundingRound,
} from "../../../server/funding-rounds.js";
import { useState, useEffect } from "react";
import {
  CircleDollarSign,
  Plus,
  Calendar,
  DollarSign,
  Eye,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin/rounds/")({
  component: RoundsList,
});

const ROUND_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800", label: "Open" },
  closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
  reviewing: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reviewing" },
  awarded: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Awarded" },
};

function RoundStatusBadge({ status }: { status: string }) {
  const config = ROUND_STATUS_STYLES[status] || ROUND_STATUS_STYLES.open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function RoundsList() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    budgetAmount: "",
  });

  const loadRounds = async () => {
    const data = await getFundingRounds();
    setRounds(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRounds();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.budgetAmount) return;
    setCreating(true);
    await createFundingRound({
      data: {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        budgetAmount: form.budgetAmount,
      },
    });
    setForm({ name: "", description: "", startDate: "", endDate: "", budgetAmount: "" });
    setShowCreate(false);
    setCreating(false);
    await loadRounds();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-indigo-600" />
            Funding Rounds
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {rounds.length} round{rounds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancel" : "New Round"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-5 mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Create Funding Round
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Round Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2026 Q2 Funding Round"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description for this round..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Budget Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.budgetAmount}
                onChange={(e) => setForm((p) => ({ ...p, budgetAmount: e.target.value }))}
                placeholder="e.g. 10000"
                min="1"
                step="0.01"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !form.name.trim() || !form.startDate || !form.endDate || !form.budgetAmount}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Create Round"}
          </button>
        </form>
      )}

      {rounds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CircleDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No funding rounds yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first funding round to start organising applications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <Link
              key={round.id}
              to="/admin/rounds/$id"
              params={{ id: String(round.id) }}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {round.name}
                    </h3>
                    <RoundStatusBadge status={round.status} />
                  </div>
                  {round.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {round.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(round.budgetAmount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {round.startDate} — {round.endDate}
                    </span>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
