import { createFileRoute } from "@tanstack/react-router";
import {
  ASSESSMENT_CRITERIA,
  MAX_SCORE,
  TOTAL_WEIGHT,
  MAX_WEIGHTED_SCORE,
  MIN_VIABLE_AMOUNT,
} from "../../lib/assessment.js";

export const Route = createFileRoute("/admin/criteria")({
  component: AssessmentCriteriaPage,
});

const CRITERIA_DESCRIPTIONS: Record<string, string> = {
  alignmentWithMission:
    "How well the project aligns with Rainbow Wellington's mission to support and empower rainbow communities.",
  needAndImpact:
    "Clear case for the project, demonstrable benefit to rainbow communities, realistic expected outcomes.",
  projectDesignAndOrganisation:
    "Well-structured plan with clear timeline, roles, and deliverables.",
  engagementWithOrganisation:
    "Genuine opportunities for RW members to participate or benefit.",
  promotionOfMembership:
    "Plan to promote RW membership through activities or communications.",
  budgetAndUseOfFunds:
    "Realistic, itemised budget with clear justification of requested amount.",
  fundingLeverageOtherGrants:
    "Evidence of co-funding, in-kind support, or other revenue.",
  sustainabilityAndLegacy:
    "Ongoing impact, asset retention, or contribution to community capacity.",
};

const SCORE_GUIDE = [
  { score: 0, label: "Not addressed" },
  { score: 1, label: "Very weak" },
  { score: 2, label: "Below expectations" },
  { score: 3, label: "Meets expectations" },
  { score: 4, label: "Above expectations" },
  { score: 5, label: "Outstanding" },
];

const EXAMPLE_SCORES = [
  { key: "alignmentWithMission", score: 4 },
  { key: "needAndImpact", score: 3 },
  { key: "projectDesignAndOrganisation", score: 4 },
  { key: "engagementWithOrganisation", score: 3 },
  { key: "promotionOfMembership", score: 2 },
  { key: "budgetAndUseOfFunds", score: 4 },
  { key: "fundingLeverageOtherGrants", score: 2 },
  { key: "sustainabilityAndLegacy", score: 3 },
];

function AssessmentCriteriaPage() {
  const exampleTotal = EXAMPLE_SCORES.reduce((sum, ex) => {
    const criterion = ASSESSMENT_CRITERIA.find((c) => c.key === ex.key);
    return sum + ex.score * (criterion?.weight ?? 0);
  }, 0);
  const examplePercentage = ((exampleTotal / MAX_WEIGHTED_SCORE) * 100).toFixed(0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Grant Assessment Rubric
        </h1>
        <p className="mt-1 text-gray-500">
          Rainbow Wellington grant assessment criteria, scoring guide, and
          funding policy rules.
        </p>
      </div>

      {/* Criteria Table */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Assessment Criteria
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  #
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Criteria
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Summary
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Score Range
                </th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ASSESSMENT_CRITERIA.map((criterion, index) => (
                <tr key={criterion.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {criterion.label}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {CRITERIA_DESCRIPTIONS[criterion.key]}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    0–{MAX_SCORE}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-6 bg-indigo-50 text-indigo-700 rounded font-semibold text-xs">
                      {criterion.weight}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-right font-semibold text-gray-700"
                >
                  Total Weight
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-6 bg-indigo-100 text-indigo-800 rounded font-bold text-xs">
                    {TOTAL_WEIGHT}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scoring Guide */}
        <section className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Scoring Guide
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              For each criterion, assign a score from 0 to {MAX_SCORE}:
            </p>
            <div className="space-y-2">
              {SCORE_GUIDE.map((item) => (
                <div
                  key={item.score}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold text-gray-700">
                    {item.score}
                  </span>
                  <span className="text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Weighted Scoring</p>
              <p>
                Multiply each score by its weight, then add for a final weighted
                score. Maximum possible score: {MAX_SCORE} × {TOTAL_WEIGHT} ={" "}
                {MAX_WEIGHTED_SCORE}.
              </p>
            </div>
          </div>
        </section>

        {/* Tier System */}
        <section className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Tier System
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-full font-bold text-sm shrink-0">
                1
              </span>
              <div>
                <p className="font-semibold text-emerald-800">
                  Tier 1 — ≥ 80%
                </p>
                <p className="text-sm text-emerald-700">
                  Full requested amount (up to pool cap)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-full font-bold text-sm shrink-0">
                2
              </span>
              <div>
                <p className="font-semibold text-amber-800">
                  Tier 2 — ≥ 50%
                </p>
                <p className="text-sm text-amber-700">
                  Partial funding (proportional to score)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full font-bold text-sm shrink-0">
                3
              </span>
              <div>
                <p className="font-semibold text-red-800">Tier 3 — &lt; 50%</p>
                <p className="text-sm text-red-700">
                  Typically declined or minimal funding
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>
                Minimum viable grant amount:{" "}
                <span className="font-semibold text-gray-700">
                  ${MIN_VIABLE_AMOUNT}
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Funding Policy Rules */}
      <section className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Funding Policy Rules for Scoring
          </h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
              No applicant may receive more than{" "}
              <span className="font-semibold">25%</span> of the grant pool.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
              Budget must match the amount requested.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
              Budget from funded sources cannot automatically be used in the
              assessment/scoring.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
              Fixed and known costs may be discounted/overlooked.
            </li>
          </ul>
        </div>
      </section>

      {/* How to Apply Funding Policy Rules in Scoring */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            How to Apply Funding Policy Rules in Scoring
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Policy Rule
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                  Rubric Application
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  No commercial/for-profit activities/organisations
                </td>
                <td className="px-6 py-4 text-gray-600">
                  If a project has a commercial aim or for-profit structure, score 0 in Alignment and exclude from approved list.
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  No wages/salaries for event organisers
                </td>
                <td className="px-6 py-4 text-gray-600">
                  Budget that includes wages automatically scores 0 in Budget unless clear justification that it's a contracted essential service (very limited).
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  No travel of non-Wellingtonians
                </td>
                <td className="px-6 py-4 text-gray-600">
                  Travel budget for non-locals should score 0 in Budget unless justified and essential.
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  Food and travel only discretionary
                </td>
                <td className="px-6 py-4 text-gray-600">
                  If food/travel are included, assess justification critically — strong justification gets a higher score in Budget; weak gets 0–1.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Example Calculation */}
      <section className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Example Calculation
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            If a reviewer scores the following:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Criteria
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Score
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Weight
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Weighted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {EXAMPLE_SCORES.map((ex) => {
                  const criterion = ASSESSMENT_CRITERIA.find(
                    (c) => c.key === ex.key
                  );
                  const weighted = ex.score * (criterion?.weight ?? 0);
                  return (
                    <tr key={ex.key} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">
                        {criterion?.label}
                      </td>
                      <td className="px-4 py-2 text-center font-medium text-gray-900">
                        {ex.score}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-500">
                        ×{criterion?.weight}
                      </td>
                      <td className="px-4 py-2 text-center font-medium text-gray-900">
                        {weighted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td
                    colSpan={3}
                    className="px-4 py-2 text-right font-semibold text-gray-700"
                  >
                    Total Weighted Score
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-indigo-700">
                    {exampleTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-medium">Percentage:</span> {exampleTotal} /{" "}
              {MAX_WEIGHTED_SCORE} = <span className="font-bold">{examplePercentage}%</span>
            </p>
            <p>
              <span className="font-medium">Result:</span>{" "}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-xs">
                Tier 2
              </span>{" "}
              — Partial funding (proportional to score)
            </p>
          </div>
        </div>
      </section>

      {/* Funding Calculation Formula */}
      <section className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Funding Calculation
          </h2>
        </div>
        <div className="p-6 text-sm text-gray-700 space-y-3">
          <p>Each criterion is scored 0–{MAX_SCORE}, weighted as listed above.</p>
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg font-mono text-xs">
            <p>Weighted Score = Sum of (score × weight)</p>
            <p>
              Total = {TOTAL_WEIGHT} (maximum sum of weights)
            </p>
            <p>
              Max possible score = {MAX_SCORE} × {TOTAL_WEIGHT} ={" "}
              {MAX_WEIGHTED_SCORE}
            </p>
            <p>Percentage = Weighted Score / {MAX_WEIGHTED_SCORE} × 100</p>
          </div>
        </div>
      </section>
    </div>
  );
}
