import jsPDF from "jspdf";

interface ApplicationData {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  roleInOrganization?: string | null;
  organizationWebsite?: string | null;
  projectOrganizer?: string | null;
  projectTitle: string;
  projectDescription: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectLocation?: string | null;
  targetAudience?: string | null;
  expectedBeneficiaries?: string | null;
  grantAmountRequested: number;
  totalProjectBudget?: number | null;
  budgetBreakdown?: string | null;
  otherFundingSources?: string | null;
  previousFunding?: boolean | null;
  previousFundingDetails?: string | null;
  communityBenefit: string;
  exclusivityJustification?: string | null;
  engageRainbowWellington?: string | null;
  promoteRainbowWellington?: string | null;
  expectedOutcomes?: string | null;
  successMeasurement?: string | null;
  howDidYouHear?: string | null;
  additionalInfo?: string | null;
  status: string;
  createdAt: string | Date;
}

const PAGE_WIDTH = 210;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MARGIN_BOTTOM = 25;
const PAGE_HEIGHT = 297;

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  declined: "Declined",
  more_info_needed: "More Info Needed",
};

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addSectionHeader(doc: jsPDF, y: number, title: string): number {
  y = checkPageBreak(doc, y, 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(title, MARGIN_LEFT, y);
  y += 2;
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 6;
  return y;
}

function addField(
  doc: jsPDF,
  y: number,
  label: string,
  value: string | null | undefined
): number {
  if (!value) return y;
  y = checkPageBreak(doc, y, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text(label, MARGIN_LEFT, y);
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH);
  for (const line of lines) {
    y = checkPageBreak(doc, y, 5);
    doc.text(line, MARGIN_LEFT, y);
    y += 4.5;
  }
  y += 3;
  return y;
}

export function generateApplicationPdf(application: ApplicationData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = 20;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const titleLines = doc.splitTextToSize(
    application.projectTitle,
    CONTENT_WIDTH
  );
  for (const line of titleLines) {
    doc.text(line, MARGIN_LEFT, y);
    y += 7;
  }

  y += 1;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const submittedDate = new Date(application.createdAt).toLocaleDateString();
  doc.text(
    `Application #${application.id}  •  Submitted ${submittedDate}  •  Status: ${STATUS_LABELS[application.status] || application.status}`,
    MARGIN_LEFT,
    y
  );
  y += 10;

  // Contact Information
  y = addSectionHeader(doc, y, "CONTACT INFORMATION");
  y = addField(doc, y, "Full Name", application.fullName);
  y = addField(doc, y, "Email", application.email);
  y = addField(doc, y, "Phone", application.phone);

  // Organisation Details
  y = addSectionHeader(doc, y, "ORGANISATION DETAILS");
  y = addField(doc, y, "Organisation", application.organizationName);
  y = addField(doc, y, "Type", application.organizationType);
  y = addField(doc, y, "Role", application.roleInOrganization);
  y = addField(doc, y, "Website", application.organizationWebsite);

  // Project Details
  y = addSectionHeader(doc, y, "PROJECT DETAILS");
  y = addField(doc, y, "Project Organiser", application.projectOrganizer);
  y = addField(doc, y, "Description", application.projectDescription);
  y = addField(doc, y, "Start Date", application.projectStartDate);
  y = addField(doc, y, "End Date", application.projectEndDate);
  y = addField(doc, y, "Location", application.projectLocation);
  y = addField(
    doc,
    y,
    "Expected Beneficiaries",
    application.expectedBeneficiaries
  );
  y = addField(doc, y, "Target Audience", application.targetAudience);

  // Funding Details
  y = addSectionHeader(doc, y, "FUNDING DETAILS");
  y = addField(
    doc,
    y,
    "Amount Requested",
    application.grantAmountRequested
      ? `$${application.grantAmountRequested.toLocaleString()}`
      : null
  );
  y = addField(
    doc,
    y,
    "Total Project Budget",
    application.totalProjectBudget
      ? `$${application.totalProjectBudget.toLocaleString()}`
      : null
  );
  y = addField(doc, y, "Budget Breakdown", application.budgetBreakdown);
  y = addField(doc, y, "Other Funding Sources", application.otherFundingSources);
  if (application.previousFunding) {
    y = addField(
      doc,
      y,
      "Previous Funding Details",
      application.previousFundingDetails
    );
  }

  // Impact & Outcomes
  y = addSectionHeader(doc, y, "IMPACT & OUTCOMES");
  y = addField(doc, y, "Community Benefit", application.communityBenefit);
  y = addField(
    doc,
    y,
    "Exclusivity Justification",
    application.exclusivityJustification
  );
  y = addField(
    doc,
    y,
    "Engagement with Rainbow Wellington",
    application.engageRainbowWellington
  );
  y = addField(
    doc,
    y,
    "Promoting Rainbow Wellington",
    application.promoteRainbowWellington
  );
  y = addField(doc, y, "Expected Outcomes", application.expectedOutcomes);
  y = addField(doc, y, "Success Measurement", application.successMeasurement);

  // Additional Information
  if (application.howDidYouHear || application.additionalInfo) {
    y = addSectionHeader(doc, y, "ADDITIONAL INFORMATION");
    y = addField(
      doc,
      y,
      "How They Heard About Us",
      application.howDidYouHear
    );
    y = addField(doc, y, "Additional Notes", application.additionalInfo);
  }

  const safeTitle = application.projectTitle
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50);
  doc.save(`Application_${application.id}_${safeTitle}.pdf`);
}
