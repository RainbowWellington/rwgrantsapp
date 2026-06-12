import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getFundingRoundById,
  updateFundingRound,
  deleteFundingRound,
  getApplicationsForRound,
  getRoundStats,
  assignApplicationToRound,
} from "../../../server/funding-rounds.js";
import { getApplications } from "../../../server/applications.js";
import { getApplicationsWithAssessments } from "../../../server/assessments.js";
import {
  calculateGrantSummary,
  type GrantApplication,
  type GrantSummary,
} from "../../../lib/assessment.js";
import { StatusBadge } from "../../../components/StatusBadge.js";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  Save,
  X,
  Plus,
  FileText,
  CheckCircle,
  ClipboardCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin/rounds/$id")({
  component: RoundDetail,
});

const ROUND_STATUSES = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "awarded", label: "Awarded" },
  { value: "closed", label: "Closed" },
];

const ROUND_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800" },
  closed: { bg: "bg-gray-100", text: "text-gray-800" },
  reviewing: { bg: "bg-yellow-100", text: "text-yellow-800" },
  awarded: { bg: "bg-indigo-100", text: "text-indigo-800" },
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 | null }) {
  if (tier === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        N/A
      </span>
    );
  }
  const styles = {
    1: "bg-emerald-100 text-emerald-800",
    2: "bg-amber-100 text-amber-800",
    3: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}>
      Tier {tier}
    </span>
  );
}

function RoundDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [round, setRound] = useState<any>(null);
  const [roundApps, setRoundApps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [allApps, setAllApps] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "assessments">("applications");
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const roundId = parseInt(id, 10);

  const loadData = async () => {
    const [r, apps, st] = await Promise.all([
      getFundingRoundById({ data: { id: roundId } }),
      getApplicationsForRound({ data: { roundId } }),
      getRoundStats({ data: { roundId } }),
    ]);
    setRound(r);
    setRoundApps(apps);
    setStats(st);
    setLoading(false);
  };

  const loadAssessments = async () => {
    setLoadingAssessments(true);
    const data = await getApplicationsWithAssessments();
    const roundOnly = data.filter((a: any) => a.fundingRoundId === roundId);
    setAssessmentData(roundOnly);
    setLoadingAssessments(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "assessments") {
      loadAssessments();
    }
  }, [activeTab]);

  const startEditing = () => {
    setEditForm({
      name: round.name,
      description: round.description || "",
      startDate: round.startDate,
      endDate: round.endDate,
      budgetAmount: round.budgetAmount,
      status: round.status,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateFundingRound({
      data: {
        id: roundId,
        name: editForm.name,
        description: editForm.description || undefined,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        budgetAmount: String(editForm.budgetAmount),
        status: editForm.status,
      },
    });
    if (updated) setRound(updated);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteFundingRound({ data: { id: roundId } });
    navigate({ to: "/admin/rounds" });
  };

  const openAssignModal = async () => {
    const apps = await getApplications();
    setAllApps(apps);
    setShowAssign(true);
  };

  const handleAssign = async (appId: number) => {
    setAssigning(appId);
    await assignApplicationToRound({ data: { applicationId: appId, fundingRoundId: roundId } });
    setAssigning(null);
    setAllApps((prev) => prev.filter((a) => a.id !== appId));
    await loadData();
  };

  const handleRemoveFromRound = async (appId: number) => {
    setAssigning(appId);
    await assignApplicationToRound({ data: { applicationId: appId, fundingRoundId: null } });
    setAssigning(null);
    await loadData();
    if (activeTab === "assessments") {
      await loadAssessments();
    }
  };

  const unassignedApps = allApps.filter(
    (a) => !a.fundingRoundId || a.fundingRoundId !== roundId
  );

  const budgetNum = round ? parseFloat(round.budgetAmount) : 0;

  const summaries: GrantSummary[] = assessmentData.map((app) => {
    const grantApp: GrantApplication = {
      id: app.id,
      fullName: app.fullName,
      projectTitle: app.projectTitle,
      grantAmountRequested: app.grantAmountRequested,
      eligible: app.eligible ?? false,
      notes: app.notes,
      assessments: app.assessments.map((a: any) => ({
        ...a,
        applicationId: a.applicationId,
        reviewerEmail: a.reviewerEmail,
        reviewerName: a.reviewerName,
      })),
    };
    return calculateGrantSummary(grantApp, budgetNum);
  });

  const allReviewerNames = Array.from(
    new Set(summaries.flatMap((s) => s.reviewerScores.map((r) => r.reviewerName)))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Funding round not found.</p>
        <Link to="/admin/rounds" className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block">
          Back to rounds
        </Link>
      </div>
    );
  }

  const statusStyle = ROUND_STATUS_STYLES[round.status] || ROUND_STATUS_STYLES.open;

  return (
    <div>
      <Link
        to="/admin/rounds"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to rounds
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{round.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {ROUND_STATUSES.find((s) => s.value === round.status)?.label || round.status}
            </span>
          </div>
          {round.description && (
            <p className="text-gray-500 text-sm">{round.description}</p>
          )}
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {round.startDate} — {round.endDate}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Budget: {formatCurrency(round.budgetAmount)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Round Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((p: any) => ({ ...p, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm((p: any) => ({ ...p, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Budget Amount ($)</label>
              <input
                type="number"
                value={editForm.budgetAmount}
                onChange={(e) => setEditForm((p: any) => ({ ...p, budgetAmount: e.target.value }))}
                min="1"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                {ROUND_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="bg-indigo-500 w-9 h-9 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Applications</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="bg-green-500 w-9 h-9 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="bg-purple-500 w-9 h-9 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Requested</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRequested)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="bg-green-600 w-9 h-9 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Approved $</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalApproved)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "applications"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Applications ({roundApps.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("assessments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "assessments"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            Assessment Summary
          </span>
        </button>
      </div>

      {activeTab === "applications" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Applications in this Round</h2>
            <button
              onClick={openAssignModal}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Assign Applications
            </button>
          </div>

          {roundApps.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications assigned to this round yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Use "Assign Applications" to add existing applications to this round.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {roundApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3"
                >
                  <Link
                    to="/admin/applications/$id"
                    params={{ id: String(app.id) }}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                        {app.projectTitle}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {app.fullName}
                      {app.organizationName && ` — ${app.organizationName}`}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${app.grantAmountRequested?.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFromRound(app.id)}
                    disabled={assigning === app.id}
                    className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded transition-colors flex-shrink-0"
                    title="Remove from round"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "assessments" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Assessment Summary — {round.name}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Grant pool for this round: {formatCurrency(round.budgetAmount)}
          </p>

          {loadingAssessments ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications in this round to assess.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Applicant / Project</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Requested</th>
                      {allReviewerNames.map((name) => (
                        <th key={name} className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{name}</th>
                      ))}
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Average</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Eligible</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Tier</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Max Allowed</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Min Viable</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summaries.map((summary) => (
                      <tr key={summary.applicationId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/applications/$id"
                            params={{ id: String(summary.applicationId) }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            {summary.applicantName}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{summary.projectTitle}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">{formatCurrency(summary.requestedAmount)}</td>
                        {allReviewerNames.map((name) => {
                          const score = summary.reviewerScores.find((r) => r.reviewerName === name);
                          return (
                            <td key={name} className="px-4 py-3 text-right whitespace-nowrap">
                              <span className={score?.percentage != null ? "text-gray-900 font-medium" : "text-gray-400"}>
                                {formatPercent(score?.percentage ?? null)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-semibold ${
                            summary.averagePercentage !== null
                              ? summary.averagePercentage >= 80
                                ? "text-emerald-700"
                                : summary.averagePercentage >= 50
                                  ? "text-amber-700"
                                  : "text-red-700"
                              : "text-gray-400"
                          }`}>
                            {formatPercent(summary.averagePercentage)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            summary.eligible ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                          }`}>
                            {summary.eligible ? "Y" : "N"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TierBadge tier={summary.tier} />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">{formatCurrency(summary.maxAllowed)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">{formatCurrency(summary.minViable)}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{summary.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Applications</h3>
              <button onClick={() => setShowAssign(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {unassignedApps.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  All applications are already assigned to this round.
                </p>
              ) : (
                <div className="space-y-2">
                  {unassignedApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{app.projectTitle}</p>
                        <p className="text-xs text-gray-500">{app.fullName} — ${app.grantAmountRequested?.toLocaleString()}</p>
                        {app.fundingRoundId && (
                          <p className="text-xs text-orange-600 mt-0.5">Currently in another round</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAssign(app.id)}
                        disabled={assigning === app.id}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {assigning === app.id ? "..." : "Assign"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Funding Round</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete this funding round?
            </p>
            <p className="text-sm text-gray-500 mb-2">
              <strong>{round.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Applications currently assigned to this round will be unassigned but not deleted.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
