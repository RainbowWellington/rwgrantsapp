import { createFileRoute, Link } from "@tanstack/react-router";
import { getApplications } from "../../../server/applications.js";
import { getFundingRounds } from "../../../server/funding-rounds.js";
import { useState, useEffect } from "react";
import { StatusBadge, STATUSES } from "../../../components/StatusBadge.js";
import { Search, Eye, Calendar, DollarSign, CircleDollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/applications/")({
  component: ApplicationsList,
});

function ApplicationsList() {
  const [applications, setApplications] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([getApplications(), getFundingRounds()]).then(([apps, rds]) => {
      setApplications(apps);
      setRounds(rds);
      if (rds.length > 0) {
        setRoundFilter(String(rds[0].id));
      } else {
        setRoundFilter("unassigned");
      }
      setLoading(false);
    });
  }, []);

  const roundMap = new Map(rounds.map((r) => [r.id, r.name]));

  const filtered = applications.filter((app) => {
    const matchesFilter = filter === "all" || app.status === filter;
    const matchesRound =
      roundFilter === "unassigned" ? !app.fundingRoundId : String(app.fundingRoundId) === roundFilter;
    const matchesSearch =
      !search ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      (app.organizationName || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesRound && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Applications</h1>

      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, project, email, or organisation..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="unassigned">Unassigned</option>
            {rounds.map((r) => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No applications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link
              key={app.id}
              to="/admin/applications/$id"
              params={{ id: String(app.id) }}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {app.projectTitle}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {app.fullName}
                    {app.organizationName && ` - ${app.organizationName}`}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />$
                      {app.grantAmountRequested?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {app.fundingRoundId && roundMap.has(app.fundingRoundId) && (
                      <span className="flex items-center gap-1 text-indigo-600">
                        <CircleDollarSign className="w-3 h-3" />
                        {roundMap.get(app.fundingRoundId)}
                      </span>
                    )}
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
