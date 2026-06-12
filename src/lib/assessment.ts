export const ASSESSMENT_CRITERIA = [
  { key: "alignmentWithMission", label: "Alignment with Mission", weight: 20 },
  { key: "needAndImpact", label: "Need & Impact", weight: 20 },
  { key: "projectDesignAndOrganisation", label: "Project Design & Organisation", weight: 15 },
  { key: "engagementWithOrganisation", label: "Engagement with Organisation", weight: 10 },
  { key: "promotionOfMembership", label: "Promotion of Membership", weight: 10 },
  { key: "budgetAndUseOfFunds", label: "Budget & Use of Funds", weight: 15 },
  { key: "fundingLeverageOtherGrants", label: "Funding Leverage / Other Grants", weight: 5 },
  { key: "sustainabilityAndLegacy", label: "Sustainability & Legacy", weight: 5 },
] as const;

export type CriterionKey = (typeof ASSESSMENT_CRITERIA)[number]["key"];

export const MAX_SCORE = 5;
export const TOTAL_WEIGHT = ASSESSMENT_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
export const MAX_WEIGHTED_SCORE = MAX_SCORE * TOTAL_WEIGHT;
export const MIN_VIABLE_AMOUNT = 100;

export interface Assessment {
  id?: number;
  applicationId: number;
  reviewerEmail: string;
  reviewerName: string;
  alignmentWithMission: number | null;
  needAndImpact: number | null;
  projectDesignAndOrganisation: number | null;
  engagementWithOrganisation: number | null;
  promotionOfMembership: number | null;
  budgetAndUseOfFunds: number | null;
  fundingLeverageOtherGrants: number | null;
  sustainabilityAndLegacy: number | null;
  comments: string | null;
}

export interface GrantApplication {
  id: number;
  fullName: string;
  projectTitle: string;
  grantAmountRequested: number;
  eligible: boolean;
  notes: string | null;
  assessments: Assessment[];
}

export interface ReviewerScore {
  reviewerName: string;
  percentage: number | null;
}

export interface GrantSummary {
  applicationId: number;
  applicantName: string;
  projectTitle: string;
  requestedAmount: number;
  reviewerScores: ReviewerScore[];
  averagePercentage: number | null;
  eligible: boolean;
  tier: 1 | 2 | 3 | null;
  maxAllowed: number;
  minViable: number;
  notes: string | null;
}

function calculateReviewerPercentage(assessment: Assessment): number | null {
  let weightedTotal = 0;
  let weightUsed = 0;

  for (const criterion of ASSESSMENT_CRITERIA) {
    const score = assessment[criterion.key];
    if (score == null) continue;
    weightedTotal += score * criterion.weight;
    weightUsed += criterion.weight;
  }

  if (weightUsed === 0) return null;

  const maxPossible = MAX_SCORE * weightUsed;
  return (weightedTotal / maxPossible) * 100;
}

function determineTier(averagePercentage: number): 1 | 2 | 3 {
  if (averagePercentage >= 80) return 1;
  if (averagePercentage >= 50) return 2;
  return 3;
}

export function calculateGrantSummary(
  application: GrantApplication,
  totalGrantPool: number = 2000
): GrantSummary {
  const reviewerScores: ReviewerScore[] = application.assessments.map((a) => ({
    reviewerName: a.reviewerName,
    percentage: calculateReviewerPercentage(a),
  }));

  const validPercentages = reviewerScores
    .map((r) => r.percentage)
    .filter((p): p is number => p !== null);

  const averagePercentage =
    validPercentages.length > 0
      ? validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length
      : null;

  const tier = averagePercentage !== null ? determineTier(averagePercentage) : null;

  const maxAllowed = Math.min(
    application.grantAmountRequested,
    totalGrantPool * 0.25
  );

  return {
    applicationId: application.id,
    applicantName: application.fullName,
    projectTitle: application.projectTitle,
    requestedAmount: application.grantAmountRequested,
    reviewerScores,
    averagePercentage,
    eligible: application.eligible,
    tier,
    maxAllowed,
    minViable: MIN_VIABLE_AMOUNT,
    notes: application.notes,
  };
}
