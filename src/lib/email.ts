const RESEND_API_URL = "https://api.resend.com/emails";
const ADMIN_NOTIFICATION_EMAIL = "hello@rainbowwellington.org.nz";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return;
  }

  const fromAddress =
    process.env.EMAIL_FROM || "Rainbow Wellington Grants <hello@rainbowwellington.org.nz>";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Failed to send email to ${to}:`, body);
  }
}

export async function sendApplicationConfirmation(application: {
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
  grantAmountRequested: number | null;
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
}) {
  const row = (label: string, value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined || value === "") return "";
    const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
    return `<tr><td style="padding: 8px 12px; color: #6b7280; vertical-align: top; white-space: nowrap;">${label}</td><td style="padding: 8px 12px;">${display}</td></tr>`;
  };

  const currency = (value: number | null | undefined) =>
    value != null ? `$${value.toLocaleString()}` : null;

  const section = (title: string, rows: string) => {
    if (!rows.trim()) return "";
    return `
      <tr><td colspan="2" style="padding: 16px 12px 8px; font-weight: 600; font-size: 15px; color: #4f46e5; border-bottom: 2px solid #e5e7eb;">${title}</td></tr>
      ${rows}`;
  };

  const contactRows = [
    row("Full Name", application.fullName),
    row("Email", application.email),
    row("Phone", application.phone),
  ].join("");

  const orgRows = [
    row("Organisation Name", application.organizationName),
    row("Organisation Type", application.organizationType),
    row("Role in Organisation", application.roleInOrganization),
    row("Organisation Website", application.organizationWebsite),
  ].join("");

  const projectRows = [
    row("Project Title", application.projectTitle),
    row("Project Organiser", application.projectOrganizer),
    row("Project Description", application.projectDescription),
    row("Start Date", application.projectStartDate),
    row("End Date", application.projectEndDate),
    row("Location", application.projectLocation),
    row("Target Audience", application.targetAudience),
    row("Expected Beneficiaries", application.expectedBeneficiaries),
  ].join("");

  const fundingRows = [
    row("Grant Amount Requested", currency(application.grantAmountRequested)),
    row("Total Project Budget", currency(application.totalProjectBudget)),
    row("Budget Breakdown", application.budgetBreakdown),
    row("Other Funding Sources", application.otherFundingSources),
    row("Previous Funding", application.previousFunding),
    row("Previous Funding Details", application.previousFundingDetails),
  ].join("");

  const impactRows = [
    row("Community Benefit", application.communityBenefit),
    row("Exclusivity Justification", application.exclusivityJustification),
    row("Engage Rainbow Wellington", application.engageRainbowWellington),
    row("Promote Rainbow Wellington", application.promoteRainbowWellington),
    row("Expected Outcomes", application.expectedOutcomes),
    row("Success Measurement", application.successMeasurement),
  ].join("");

  const additionalRows = [
    row("How Did You Hear About Us", application.howDidYouHear),
    row("Additional Information", application.additionalInfo),
  ].join("");

  await sendEmail({
    to: application.email,
    subject: "We've received your grant application — Rainbow Wellington",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Rainbow Wellington Grants</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">Kia ora ${application.fullName},</p>
          <p>Thank you for submitting your grant application for <strong>${application.projectTitle}</strong>. We've received it and it is now in our review queue.</p>
          <p>Our team will assess your application and be in touch with you regarding the outcome. If we need any additional information, we'll reach out to you at this email address.</p>
          <p>Here is a summary of what you submitted:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            ${section("Contact Information", contactRows)}
            ${section("Organisation Details", orgRows)}
            ${section("Project / Event Details", projectRows)}
            ${section("Funding Details", fundingRows)}
            ${section("Impact & Outcomes", impactRows)}
            ${section("Additional Information", additionalRows)}
          </table>
          <p style="font-size: 13px; color: #6b7280;">If any of the above information is incorrect, please contact us as soon as possible.</p>
          <p style="margin-bottom: 0;">Ngā mihi,<br/>Rainbow Wellington Grants Team</p>
        </div>
      </div>
    `,
  });
}

export async function sendStatusChangeNotification(application: {
  fullName: string;
  email: string;
  projectTitle: string;
  status: string;
  notes?: string | null;
}) {
  const notesBlock = application.notes
    ? `<div style="background: #f3f4f6; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-wrap;">${application.notes}</p>
      </div>`
    : "";

  const statusContent: Record<string, { subject: string; heading: string; body: string }> = {
    under_review: {
      subject: "Your grant application is under review — Rainbow Wellington",
      heading: "Application Under Review",
      body: `<p>We wanted to let you know that your grant application for <strong>${application.projectTitle}</strong> is now being reviewed by our team.</p>
        <p>We'll be in touch once a decision has been made. If we need any additional information, we'll reach out to you at this email address.</p>`,
    },
    approved: {
      subject: "Great news — your grant application has been approved!",
      heading: "Application Approved",
      body: `<p>We're delighted to let you know that your grant application for <strong>${application.projectTitle}</strong> has been <strong style="color: #059669;">approved</strong>.</p>
        <p>A member of our team will be in touch shortly with next steps regarding funding disbursement.</p>`,
    },
    declined: {
      subject: "Update on your grant application — Rainbow Wellington",
      heading: "Application Update",
      body: `<p>Thank you for your interest in the Rainbow Wellington grants programme. After careful consideration, we're sorry to advise that your application for <strong>${application.projectTitle}</strong> has not been successful on this occasion.</p>
        ${notesBlock}
        <p>We encourage you to apply again in the future. If you'd like feedback on your application, please don't hesitate to get in touch.</p>`,
    },
    more_info_needed: {
      subject: "We need more information about your grant application",
      heading: "Additional Information Requested",
      body: `<p>Our team has been reviewing your grant application for <strong>${application.projectTitle}</strong> and we need some additional information before we can proceed.</p>
        ${notesBlock}
        <p>Please reply to this email or contact us at your earliest convenience so we can continue processing your application.</p>`,
    },
  };

  const content = statusContent[application.status];
  if (!content) return;

  await sendEmail({
    to: application.email,
    subject: content.subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">${content.heading}</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-top: 0;">Kia ora ${application.fullName},</p>
          ${content.body}
          <p style="margin-bottom: 0;">Ngā mihi,<br/>Rainbow Wellington Grants Team</p>
        </div>
      </div>
    `,
  });
}

export async function sendNewApplicationNotification(application: {
  fullName: string;
  email: string;
  projectTitle: string;
  organizationName?: string | null;
  grantAmountRequested: number | null;
}) {
  const orgLine = application.organizationName
    ? `<tr><td style="padding: 6px 12px; color: #6b7280;">Organisation</td><td style="padding: 6px 12px; font-weight: 500;">${application.organizationName}</td></tr>`
    : "";

  const amount = application.grantAmountRequested
    ? `$${application.grantAmountRequested.toLocaleString()}`
    : "Not specified";

  await sendEmail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `New grant application: ${application.projectTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New Grant Application</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin-top: 0;">A new grant application has been submitted and is awaiting review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 12px; color: #6b7280;">Applicant</td><td style="padding: 6px 12px; font-weight: 500;">${application.fullName}</td></tr>
            <tr><td style="padding: 6px 12px; color: #6b7280;">Email</td><td style="padding: 6px 12px;"><a href="mailto:${application.email}" style="color: #4f46e5;">${application.email}</a></td></tr>
            ${orgLine}
            <tr><td style="padding: 6px 12px; color: #6b7280;">Project</td><td style="padding: 6px 12px; font-weight: 500;">${application.projectTitle}</td></tr>
            <tr><td style="padding: 6px 12px; color: #6b7280;">Amount Requested</td><td style="padding: 6px 12px; font-weight: 500;">${amount}</td></tr>
          </table>
          <p>Log in to the admin portal to review this application.</p>
        </div>
      </div>
    `,
  });
}
