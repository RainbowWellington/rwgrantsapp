import { createFileRoute, Link } from "@tanstack/react-router";
import { getApplicationsWithAssessments } from "../../server/assessments.js";
import { getFundingRounds } from "../../server/funding-rounds.js";
import { toggleApplicationEligibility, updateAmountAwarded } from "../../server/applications.js";
import {
  calculateGrantSummary,
  type GrantApplication,
  type GrantSummary,
} from "../../lib/assessment.js";
import { useState, useEffect } from "react";
import { ClipboardCheck, Check, X, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/assessments")({
  component: AssessmentSummary,
});

const DEFAULT_GRANT_POOL = 2000;

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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}
    >
      Tier {tier}
    </span>
  );
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function AssessmentSummary() {
  const [appsWithAssessments, setAppsWithAssessments] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantPool, setGrantPool] = useState(DEFAULT_GRANT_POOL);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<number | null>(null);
  const [editingAmountValue, setEditingAmountValue] = useState("");
  const [savingAmountId, setSavingAmountId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getApplicationsWithAssessments(),
      getFundingRounds(),
    ]).then(([data, roundsData]) => {
      setAppsWithAssessments(data);
      setRounds(roundsData);
      if (roundsData.length > 0) {
        setSelectedRound(String(roundsData[0].id));
      } else {
        setSelectedRound("unassigned");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedRound && selectedRound !== "unassigned") {
      const round = rounds.find((r) => String(r.id) === selectedRound);
      if (round) {
        setGrantPool(parseFloat(round.budgetAmount));
      }
    }
  }, [selectedRound, rounds]);

  const handleToggleEligibility = async (appId: number, currentEligible: boolean) => {
    setTogglingId(appId);
    try {
      await toggleApplicationEligibility({ data: { id: appId, eligible: !currentEligible } });
      setAppsWithAssessments((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, eligible: !currentEligible } : app
        )
      );
    } catch (err) {
      console.error("Failed to toggle eligibility:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveAmount = async (appId: number) => {
    setSavingAmountId(appId);
    try {
      const value = editingAmountValue.trim() === "" ? null : parseInt(editingAmountValue, 10);
      if (value !== null && isNaN(value)) return;
      await updateAmountAwarded({ data: { id: appId, amountAwarded: value } });
      setAppsWithAssessments((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, amountAwarded: value } : app
        )
      );
      setEditingAmountId(null);
    } catch (err) {
      console.error("Failed to save amount awarded:", err);
    } finally {
      setSavingAmountId(null);
    }
  };

  const filteredApps = appsWithAssessments.filter((app) => {
    if (selectedRound === "unassigned") return !app.fundingRoundId;
    return String(app.fundingRoundId) === selectedRound;
  });

  const summaries: GrantSummary[] = filteredApps.map((app) => {
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
    return calculateGrantSummary(grantApp, grantPool);
  });

  const allReviewerNames = Array.from(
    new Set(
      summaries.flatMap((s) => s.reviewerScores.map((r) => r.reviewerName))
    )
  ).sort();

  const roundCounts = {
    unassigned: appsWithAssessments.filter((a) => !a.fundingRoundId).length,
    ...Object.fromEntries(
      rounds.map((r) => [
        String(r.id),
        appsWithAssessments.filter((a) => a.fundingRoundId === r.id).length,
      ])
    ),
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
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            Assessment Summary
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Grant pool: {formatCurrency(grantPool)} &middot;{" "}
            {summaries.length} application{summaries.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <label htmlFor="round-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Funding Round
          </label>
          <select
            id="round-filter"
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            <option value="unassigned">Unassigned ({roundCounts.unassigned})</option>
            {rounds.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name} ({roundCounts[String(r.id)] ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRound !== "unassigned" && (
        <div className="mb-6 text-sm text-gray-500">
          Budget for this round: <span className="font-medium text-gray-700">{formatCurrency(grantPool)}</span>
          {" "}&middot; Max per application (25%): <span className="font-medium text-gray-700">{formatCurrency(grantPool * 0.25)}</span>
          {" "}&middot; Total Awarded: <span className="font-medium text-gray-700">{formatCurrency(filteredApps.reduce((sum, app) => sum + (app.amountAwarded ?? 0), 0))}</span>
        </div>
      )}

      {summaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {selectedRound === "unassigned"
              ? "No unassigned applications."
              : "No applications in this round."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Applicant / Project
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Requested
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    <span className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Awarded
                    </span>
                  </th>
                  {allReviewerNames.map((name) => (
                    <th
                      key={name}
                      className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {name}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Average
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Eligible
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Tier
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Max Allowed
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Min Viable
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaries.map((summary) => {
                  const app = filteredApps.find((a) => a.id === summary.applicationId);
                  const isEligible = app?.eligible ?? false;
                  const isToggling = togglingId === summary.applicationId;
                  return (
                    <tr
                      key={summary.applicationId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/applications/$id"
                          params={{ id: String(summary.applicationId) }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          {summary.applicantName}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                          {summary.projectTitle}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                        {formatCurrency(summary.requestedAmount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {editingAmountId === summary.applicationId ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-gray-400 text-xs">$</span>
                            <input
                              type="number"
                              value={editingAmountValue}
                              onChange={(e) => setEditingAmountValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveAmount(summary.applicationId);
                                if (e.key === "Escape") setEditingAmountId(null);
                              }}
                              className="w-20 px-1.5 py-0.5 text-sm text-right border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                              min={0}
                            />
                            <button
                              onClick={() => handleSaveAmount(summary.applicationId)}
                              disabled={savingAmountId === summary.applicationId}
                              className="p-0.5 text-emerald-600 hover:text-emerald-800"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingAmountId(null)}
                              className="p-0.5 text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingAmountId(summary.applicationId);
                              setEditingAmountValue(app?.amountAwarded != null ? String(app.amountAwarded) : "");
                            }}
                            className="text-sm hover:bg-gray-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="Click to edit amount awarded"
                          >
                            {app?.amountAwarded != null ? (
                              <span className="font-medium text-emerald-700">{formatCurrency(app.amountAwarded)}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </button>
                        )}
                      </td>
                      {allReviewerNames.map((name) => {
                        const score = summary.reviewerScores.find(
                          (r) => r.reviewerName === name
                        );
                        return (
                          <td
                            key={name}
                            className="px-4 py-3 text-right whitespace-nowrap"
                          >
                            <span
                              className={
                                score?.percentage != null
                                  ? "text-gray-900 font-medium"
                                  : "text-gray-400"
                              }
                            >
                              {formatPercent(score?.percentage ?? null)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            summary.averagePercentage !== null
                              ? summary.averagePercentage >= 80
                                ? "text-emerald-700"
                                : summary.averagePercentage >= 50
                                  ? "text-amber-700"
                                  : "text-red-700"
                              : "text-gray-400"
                          }`}
                        >
                          {formatPercent(summary.averagePercentage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleEligibility(summary.applicationId, isEligible)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            isEligible
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } ${isToggling ? "opacity-50" : ""}`}
                          title={isEligible ? "Click to mark ineligible" : "Click to mark eligible"}
                        >
                          {isEligible ? (
                            <><Check className="w-3 h-3" /> Yes</>
                          ) : (
                            <><X className="w-3 h-3" /> No</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TierBadge tier={summary.tier} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                        {formatCurrency(summary.maxAllowed)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                        {formatCurrency(summary.minViable)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                        {summary.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
