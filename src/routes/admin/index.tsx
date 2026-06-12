import { createFileRoute, Link } from "@tanstack/react-router";
import { getApplicationStats } from "../../server/applications.js";
import { getFundingRounds } from "../../server/funding-rounds.js";
import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  CircleDollarSign,
  ArrowRight,
  Banknote,
  BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const ROUND_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800", label: "Open" },
  closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
  reviewing: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Reviewing" },
  awarded: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Awarded" },
};

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getApplicationStats(), getFundingRounds()]).then(
      ([statsData, roundsData]) => {
        setStats(statsData);
        setRounds(roundsData);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      label: "Under Review",
      value: stats.underReview,
      icon: AlertCircle,
      color: "bg-yellow-500",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Declined",
      value: stats.declined,
      icon: XCircle,
      color: "bg-red-500",
    },
    {
      label: "Paid",
      value: stats.paid,
      icon: Banknote,
      color: "bg-emerald-500",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: BadgeCheck,
      color: "bg-purple-500",
    },
    {
      label: "Total Requested",
      value: `$${stats.totalRequested.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ];

  const activeRounds = rounds.filter(
    (r) => r.status === "open" || r.status === "reviewing"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div
              className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}
            >
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {activeRounds.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-indigo-600" />
              Active Funding Rounds
            </h2>
            <Link
              to="/admin/rounds"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all rounds
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeRounds.map((round) => {
              const style = ROUND_STATUS_STYLES[round.status] || ROUND_STATUS_STYLES.open;
              return (
                <Link
                  key={round.id}
                  to="/admin/rounds/$id"
                  params={{ id: String(round.id) }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{round.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${parseFloat(round.budgetAmount).toLocaleString()}
                    </span>
                    <span>
                      {round.startDate} — {round.endDate}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className="mt-8 text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Applications will appear here once submitted through the public
            form.
          </p>
        </div>
      )}
    </div>
  );
}
