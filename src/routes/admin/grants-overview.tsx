import { createFileRoute, Link } from "@tanstack/react-router";
import { getApplications } from "../../server/applications.js";
import { getFundingRounds } from "../../server/funding-rounds.js";
import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/grants-overview")({
  component: GrantsOverview,
});

function GrantsOverview() {
  const [applications, setApplications] = useState<any[]>([]);
  const [fundingRoundsList, setFundingRoundsList] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getApplications(), getFundingRounds()]).then(
      ([apps, rounds]) => {
        setApplications(apps);
        setFundingRoundsList(rounds);
        setLoading(false);
      }
    );
  }, []);

  const filteredApplications =
    selectedRoundId === "all"
      ? applications
      : selectedRoundId === "unassigned"
        ? applications.filter((a) => !a.fundingRoundId)
        : applications.filter(
            (a) => a.fundingRoundId === Number(selectedRoundId)
          );

  const approvedStatuses = ["approved", "paid", "completed"];
  const approvedApps = filteredApplications.filter((a) =>
    approvedStatuses.includes(a.status)
  );
  const declinedApps = filteredApplications.filter(
    (a) => a.status === "declined"
  );

  const totalRequested = approvedApps.reduce(
    (sum, a) => sum + (a.grantAmountRequested || 0),
    0
  );
  const totalAwarded = approvedApps.reduce(
    (sum, a) => sum + (a.amountAwarded || 0),
    0
  );

  const selectedRoundName =
    selectedRoundId === "all"
      ? "All Rounds"
      : selectedRoundId === "unassigned"
        ? "Unassigned"
        : fundingRoundsList.find((r) => r.id === Number(selectedRoundId))
            ?.name ?? "";

  function exportApprovedToExcel() {
    const rows = approvedApps.map((app) => ({
      "Full Name": app.fullName || "",
      Organisation: app.organizationName || "",
      "Requested Amount": app.grantAmountRequested || 0,
      Project: app.projectTitle || "",
      "Awarded Amount": app.amountAwarded ?? "",
      "Outcome Informed": app.outcomeInformed ? "Yes" : "No",
      "Signed T&Cs": app.signedTermsAndConditions ? "Yes" : "No",
      "Bank Account Name": app.bankAccountName || "",
      "Bank Account Number": app.bankAccountNumber || "",
      "Paid Date": app.datePaid || "",
      Notes: app.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved Grants");
    const filename = `approved-grants${selectedRoundId !== "all" ? `-${selectedRoundName.replace(/\s+/g, "-").toLowerCase()}` : ""}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grants Overview</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Funding Rounds</option>
              <option value="unassigned">Unassigned</option>
              {fundingRoundsList.map((round) => (
                <option key={round.id} value={String(round.id)}>
                  {round.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex-1 text-center">
            Approved Grants
          </h2>
          {approvedApps.length > 0 && (
            <button
              onClick={exportApprovedToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          )}
        </div>
        {approvedApps.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No approved grants yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Name & Organisation
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Requested $
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Project
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Details
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Awarded $
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Told Y/N
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Signed T&Cs Y/N
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Bank Account
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Paid Date
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        to="/admin/applications/$id"
                        params={{ id: String(app.id) }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {app.fullName}
                      </Link>
                      {app.organizationName && (
                        <div className="text-xs text-gray-500">
                          {app.organizationName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      ${app.grantAmountRequested?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="line-clamp-2">{app.projectTitle}</span>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="line-clamp-2 text-gray-600">
                        {app.projectDescription || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {app.amountAwarded != null
                        ? `$${app.amountAwarded.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {app.outcomeInformed ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {app.signedTermsAndConditions ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {app.bankAccountName || app.bankAccountNumber ? (
                        <div>
                          {app.bankAccountName && (
                            <div className="font-medium">
                              {app.bankAccountName}
                            </div>
                          )}
                          {app.bankAccountNumber && (
                            <div className="text-xs text-gray-500">
                              {app.bankAccountNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {app.datePaid || "—"}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="line-clamp-2 text-gray-600">
                        {app.notes || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 font-semibold">
                  <td className="px-3 py-2 text-gray-900">Totals</td>
                  <td className="px-3 py-2">
                    ${totalRequested.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-3 py-2">
                    ${totalAwarded.toLocaleString()}
                  </td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
          Declined Grants
        </h2>
        {declinedApps.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No declined grants.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Name & Organisation
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Project
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    Told Y/N
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {declinedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-red-50/30 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        to="/admin/applications/$id"
                        params={{ id: String(app.id) }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {app.fullName}
                      </Link>
                      {app.organizationName && (
                        <div className="text-xs text-gray-500">
                          {app.organizationName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{app.projectTitle}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {app.outcomeInformed ? (
                        <span className="text-green-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
