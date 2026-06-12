import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getApplicationById,
  updateApplicationStatus,
  updateApplication,
  deleteApplication,
} from "../../../server/applications.js";
import { getComments, addComment } from "../../../server/comments.js";
import {
  getAssessmentsForApplication,
  upsertAssessment,
} from "../../../server/assessments.js";
import { getFundingRounds, assignApplicationToRound } from "../../../server/funding-rounds.js";
import { getFileDownloadUrl, uploadFile } from "../../../server/uploads.js";
import { StatusBadge, STATUSES } from "../../../components/StatusBadge.js";
import {
  ASSESSMENT_CRITERIA,
} from "../../../lib/assessment.js";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useIdentity } from "../../../lib/identity-context.js";
import { generateApplicationPdf } from "../../../lib/generate-application-pdf.js";
import {
  ArrowLeft,
  Send,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  User,
  Download,
  FileText,
  Trash2,
  AlertCircle,
  Pencil,
  X,
  Save,
  CircleDollarSign,
  ClipboardCheck,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/admin/applications/$id")({
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = Route.useParams();
  const { user } = useIdentity();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [myScores, setMyScores] = useState<Record<string, number | null>>({});
  const [assessmentComment, setAssessmentComment] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [assessmentMessage, setAssessmentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [sendEmailOnChange, setSendEmailOnChange] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [fundingRounds, setFundingRounds] = useState<any[]>([]);
  const [assigningRound, setAssigningRound] = useState(false);
  const [postEventFiles, setPostEventFiles] = useState<
    { key: string; fileName: string; contentType: string }[]
  >([]);
  const [uploadingPostEvent, setUploadingPostEvent] = useState(false);

  const loadData = async () => {
    const [app, cmts, assmts, rounds] = await Promise.all([
      getApplicationById({ data: { id: parseInt(id, 10) } }),
      getComments({ data: { applicationId: parseInt(id, 10) } }),
      getAssessmentsForApplication({
        data: { applicationId: parseInt(id, 10) },
      }),
      getFundingRounds(),
    ]);
    setApplication(app);
    setComments(cmts);
    setAssessments(assmts);
    setFundingRounds(rounds);

    if (app?.postEventFiles) {
      try {
        setPostEventFiles(JSON.parse(app.postEventFiles));
      } catch {}
    }

    const myEmail = user?.email?.toLowerCase();
    const mine = assmts.find(
      (a: any) => a.reviewerEmail.toLowerCase() === myEmail
    );
    if (mine) {
      const scores: Record<string, number | null> = {};
      for (const c of ASSESSMENT_CRITERIA) {
        scores[c.key] = mine[c.key] ?? null;
      }
      setMyScores(scores);
      setAssessmentComment(mine.comments || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const requiresReason = (status: string) =>
    status === "declined" || status === "more_info_needed";

  const handleStatusClick = (newStatus: string) => {
    setPendingStatus(newStatus);
    setStatusReason("");
    setSendEmailOnChange(true);
  };

  const handleStatusConfirm = async () => {
    if (!pendingStatus) return;
    setUpdatingStatus(true);
    const updated = await updateApplicationStatus({
      data: {
        id: parseInt(id, 10),
        status: pendingStatus,
        ...(requiresReason(pendingStatus) && statusReason.trim()
          ? { notes: statusReason.trim() }
          : {}),
        sendEmail: sendEmailOnChange,
      },
    });
    setApplication(updated);
    setUpdatingStatus(false);
    setPendingStatus(null);
    setStatusReason("");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    await addComment({
      data: {
        applicationId: parseInt(id, 10),
        content: newComment.trim(),
        authorEmail: user?.email || "unknown",
        authorName: user?.name || (user as any)?.userMetadata?.full_name || user?.email || "Admin",
      },
    });
    setNewComment("");
    const cmts = await getComments({
      data: { applicationId: parseInt(id, 10) },
    });
    setComments(cmts);
    setSubmittingComment(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteApplication({ data: { id: parseInt(id, 10) } });
    navigate({ to: "/admin/applications" });
  };

  const startEditing = () => {
    setEditForm({
      fullName: application.fullName || "",
      email: application.email || "",
      phone: application.phone || "",
      organizationName: application.organizationName || "",
      organizationType: application.organizationType || "",
      roleInOrganization: application.roleInOrganization || "",
      organizationWebsite: application.organizationWebsite || "",
      projectOrganizer: application.projectOrganizer || "",
      projectOrganisationMethod: application.projectOrganisationMethod || "",
      projectTitle: application.projectTitle || "",
      projectDescription: application.projectDescription || "",
      projectStartDate: application.projectStartDate || "",
      projectEndDate: application.projectEndDate || "",
      projectLocation: application.projectLocation || "",
      targetAudience: application.targetAudience || "",
      expectedBeneficiaries: application.expectedBeneficiaries || "",
      grantAmountRequested: application.grantAmountRequested || 0,
      totalProjectBudget: application.totalProjectBudget || 0,
      budgetBreakdown: application.budgetBreakdown || "",
      otherFundingSources: application.otherFundingSources || "",
      previousFunding: application.previousFunding || false,
      previousFundingDetails: application.previousFundingDetails || "",
      communityBenefit: application.communityBenefit || "",
      exclusivityJustification: application.exclusivityJustification || "",
      engageRainbowWellington: application.engageRainbowWellington || "",
      promoteRainbowWellington: application.promoteRainbowWellington || "",
      expectedOutcomes: application.expectedOutcomes || "",
      successMeasurement: application.successMeasurement || "",
      howDidYouHear: application.howDidYouHear || "",
      additionalInfo: application.additionalInfo || "",
      notes: application.notes || "",
      amountAwarded: application.amountAwarded ?? "",
      bankAccountNumber: application.bankAccountNumber || "",
      bankAccountName: application.bankAccountName || "",
      datePaid: application.datePaid || "",
      accountabilityReportReceived: application.accountabilityReportReceived || false,
      signedTermsAndConditions: application.signedTermsAndConditions || false,
      outcomeInformed: application.outcomeInformed || false,
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateApplication({
      data: {
        id: parseInt(id, 10),
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone || undefined,
        organizationName: editForm.organizationName || undefined,
        organizationType: editForm.organizationType || undefined,
        roleInOrganization: editForm.roleInOrganization || undefined,
        organizationWebsite: editForm.organizationWebsite || undefined,
        projectOrganizer: editForm.projectOrganizer || undefined,
        projectOrganisationMethod: editForm.projectOrganisationMethod || undefined,
        projectTitle: editForm.projectTitle,
        projectDescription: editForm.projectDescription,
        projectStartDate: editForm.projectStartDate || undefined,
        projectEndDate: editForm.projectEndDate || undefined,
        projectLocation: editForm.projectLocation || undefined,
        targetAudience: editForm.targetAudience || undefined,
        expectedBeneficiaries: editForm.expectedBeneficiaries || undefined,
        grantAmountRequested: Number(editForm.grantAmountRequested),
        totalProjectBudget: editForm.totalProjectBudget ? Number(editForm.totalProjectBudget) : undefined,
        budgetBreakdown: editForm.budgetBreakdown || undefined,
        otherFundingSources: editForm.otherFundingSources || undefined,
        previousFunding: editForm.previousFunding || undefined,
        previousFundingDetails: editForm.previousFundingDetails || undefined,
        communityBenefit: editForm.communityBenefit,
        exclusivityJustification: editForm.exclusivityJustification || undefined,
        engageRainbowWellington: editForm.engageRainbowWellington || undefined,
        promoteRainbowWellington: editForm.promoteRainbowWellington || undefined,
        expectedOutcomes: editForm.expectedOutcomes || undefined,
        successMeasurement: editForm.successMeasurement || undefined,
        howDidYouHear: editForm.howDidYouHear || undefined,
        additionalInfo: editForm.additionalInfo || undefined,
        notes: editForm.notes || null,
        amountAwarded: editForm.amountAwarded !== "" ? Number(editForm.amountAwarded) : null,
        bankAccountNumber: editForm.bankAccountNumber || null,
        bankAccountName: editForm.bankAccountName || null,
        datePaid: editForm.datePaid || null,
        accountabilityReportReceived: editForm.accountabilityReportReceived || false,
        signedTermsAndConditions: editForm.signedTermsAndConditions || false,
        outcomeInformed: editForm.outcomeInformed || false,
        postEventFiles: postEventFiles.length > 0 ? JSON.stringify(postEventFiles) : null,
      },
    });
    if (updated) {
      setApplication(updated);
    }
    setSaving(false);
    setEditing(false);
  };

  const updateField = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAssessment = async () => {
    if (!user?.email) return;
    setSavingAssessment(true);
    setAssessmentMessage(null);
    try {
      await upsertAssessment({
        data: {
          applicationId: parseInt(id, 10),
          reviewerEmail: user.email,
          reviewerName: user.name || (user as any).userMetadata?.full_name || user.email,
          alignmentWithMission: myScores.alignmentWithMission ?? null,
          needAndImpact: myScores.needAndImpact ?? null,
          projectDesignAndOrganisation:
            myScores.projectDesignAndOrganisation ?? null,
          engagementWithOrganisation:
            myScores.engagementWithOrganisation ?? null,
          promotionOfMembership: myScores.promotionOfMembership ?? null,
          budgetAndUseOfFunds: myScores.budgetAndUseOfFunds ?? null,
          fundingLeverageOtherGrants:
            myScores.fundingLeverageOtherGrants ?? null,
          sustainabilityAndLegacy: myScores.sustainabilityAndLegacy ?? null,
          comments: assessmentComment || null,
        },
      });
      const assmts = await getAssessmentsForApplication({
        data: { applicationId: parseInt(id, 10) },
      });
      setAssessments(assmts);
      setAssessmentMessage({ type: "success", text: "Assessment saved successfully." });
    } catch (err) {
      console.error("Failed to save assessment:", err);
      setAssessmentMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save assessment. Please try again.",
      });
    } finally {
      setSavingAssessment(false);
    }
  };

  const handleRoundChange = async (roundId: string) => {
    setAssigningRound(true);
    const value = roundId === "" ? null : parseInt(roundId, 10);
    const updated = await assignApplicationToRound({
      data: { applicationId: parseInt(id, 10), fundingRoundId: value },
    });
    if (updated) setApplication(updated);
    setAssigningRound(false);
  };

  const handlePostEventUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPostEvent(true);

    try {
      const newFiles: { key: string; fileName: string; contentType: string }[] = [];
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const base64Data = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        const result = await uploadFile({
          data: {
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            base64Data,
          },
        });
        newFiles.push(result);
      }
      setPostEventFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingPostEvent(false);
      e.target.value = "";
    }
  };

  const removePostEventFile = (key: string) => {
    setPostEventFiles((prev) => prev.filter((f) => f.key !== key));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Application not found.</p>
        <Link
          to="/admin/applications"
          className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block"
        >
          Back to applications
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/applications"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {application.projectTitle}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Application #{application.id} &middot; Submitted{" "}
            {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} />
          {editing ? (
            <>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.fullName?.trim() || !editForm.email?.trim() || !editForm.projectTitle?.trim() || !editForm.projectDescription?.trim() || !editForm.communityBenefit?.trim() || !editForm.grantAmountRequested}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
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
                onClick={() => generateApplicationPdf(application)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InfoSection title="Contact Information">
            {editing ? (
              <div className="space-y-3">
                <EditField label="Full Name" value={editForm.fullName} onChange={(v) => updateField("fullName", v)} required />
                <EditField label="Email" value={editForm.email} onChange={(v) => updateField("email", v)} required type="email" />
                <EditField label="Phone" value={editForm.phone} onChange={(v) => updateField("phone", v)} />
              </div>
            ) : (
              <InfoGrid>
                <InfoItem icon={User} label="Full Name" value={application.fullName} />
                <InfoItem icon={Mail} label="Email" value={application.email} />
                <InfoItem icon={Phone} label="Phone" value={application.phone} />
              </InfoGrid>
            )}
          </InfoSection>

          <InfoSection title="Organisation Details">
            {editing ? (
              <div className="space-y-3">
                <EditField label="Organisation Name" value={editForm.organizationName} onChange={(v) => updateField("organizationName", v)} />
                <EditField label="Organisation Type" value={editForm.organizationType} onChange={(v) => updateField("organizationType", v)} />
                <EditField label="Role in Organisation" value={editForm.roleInOrganization} onChange={(v) => updateField("roleInOrganization", v)} />
                <EditField label="Website" value={editForm.organizationWebsite} onChange={(v) => updateField("organizationWebsite", v)} />
              </div>
            ) : (
              <InfoGrid>
                <InfoItem icon={Building} label="Organisation" value={application.organizationName} />
                <InfoItem icon={Building} label="Type" value={application.organizationType} />
                <InfoItem icon={User} label="Role" value={application.roleInOrganization} />
                <InfoItem icon={Globe} label="Website" value={application.organizationWebsite} />
              </InfoGrid>
            )}
          </InfoSection>

          <InfoSection title="Project Details">
            {editing ? (
              <div className="space-y-3">
                <EditField label="Project Title" value={editForm.projectTitle} onChange={(v) => updateField("projectTitle", v)} required />
                <EditTextarea label="Description" value={editForm.projectDescription} onChange={(v) => updateField("projectDescription", v)} required />
                <EditTextarea label="Project Organiser" value={editForm.projectOrganizer} onChange={(v) => updateField("projectOrganizer", v)} />
                <EditTextarea label="How is the project being organised?" value={editForm.projectOrganisationMethod} onChange={(v) => updateField("projectOrganisationMethod", v)} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <EditField label="Start Date" value={editForm.projectStartDate} onChange={(v) => updateField("projectStartDate", v)} type="date" />
                  <EditField label="End Date" value={editForm.projectEndDate} onChange={(v) => updateField("projectEndDate", v)} type="date" />
                </div>
                <EditField label="Project, Event or Activity Location" value={editForm.projectLocation} onChange={(v) => updateField("projectLocation", v)} />
                <EditTextarea label="Target Audience" value={editForm.targetAudience} onChange={(v) => updateField("targetAudience", v)} />
                <EditField label="Expected Beneficiaries" value={editForm.expectedBeneficiaries} onChange={(v) => updateField("expectedBeneficiaries", v)} />
              </div>
            ) : (
              <>
                <TextBlock label="Description" value={application.projectDescription} />
                <TextBlock label="Project Organiser" value={application.projectOrganizer} className="mt-4" />
                <TextBlock label="How is the project being organised?" value={application.projectOrganisationMethod} className="mt-4" />
                <InfoGrid className="mt-4">
                  <InfoItem icon={Calendar} label="Start Date" value={application.projectStartDate} />
                  <InfoItem icon={Calendar} label="End Date" value={application.projectEndDate} />
                  <InfoItem icon={MapPin} label="Project, Event or Activity Location" value={application.projectLocation} />
                  <InfoItem icon={User} label="Expected Beneficiaries" value={application.expectedBeneficiaries} />
                </InfoGrid>
                <TextBlock label="Target Audience" value={application.targetAudience} className="mt-4" />
              </>
            )}
          </InfoSection>

          <InfoSection title="Funding Details">
            {editing ? (
              <div className="space-y-3">
                <EditField label="Amount Requested ($)" value={editForm.grantAmountRequested} onChange={(v) => updateField("grantAmountRequested", v)} required type="number" />
                <EditField label="Total Project Budget ($)" value={editForm.totalProjectBudget} onChange={(v) => updateField("totalProjectBudget", v)} type="number" />
                <EditTextarea label="Budget Breakdown" value={editForm.budgetBreakdown} onChange={(v) => updateField("budgetBreakdown", v)} />
                <EditTextarea label="Other Funding Sources" value={editForm.otherFundingSources} onChange={(v) => updateField("otherFundingSources", v)} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.previousFunding || false}
                    onChange={(e) => updateField("previousFunding", e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Previously received funding</span>
                </label>
                {editForm.previousFunding && (
                  <EditTextarea label="Previous Funding Details" value={editForm.previousFundingDetails} onChange={(v) => updateField("previousFundingDetails", v)} />
                )}
              </div>
            ) : (
              <>
                <InfoGrid>
                  <InfoItem
                    icon={DollarSign}
                    label="Amount Requested"
                    value={application.grantAmountRequested ? `$${application.grantAmountRequested.toLocaleString()}` : null}
                  />
                  <InfoItem
                    icon={DollarSign}
                    label="Total Budget"
                    value={application.totalProjectBudget ? `$${application.totalProjectBudget.toLocaleString()}` : null}
                  />
                </InfoGrid>
                <TextBlock label="Budget Breakdown" value={application.budgetBreakdown} className="mt-4" />
                <TextBlock label="Other Funding Sources" value={application.otherFundingSources} className="mt-4" />
                {application.budgetFile && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Uploaded Budget</p>
                    <UploadedFilesList filesJson={application.budgetFile} />
                  </div>
                )}
                {application.previousFunding && (
                  <TextBlock label="Previous Funding Details" value={application.previousFundingDetails} className="mt-4" />
                )}
              </>
            )}
          </InfoSection>

          <InfoSection title="Impact & Outcomes">
            {editing ? (
              <div className="space-y-3">
                <EditTextarea label="Community Benefit" value={editForm.communityBenefit} onChange={(v) => updateField("communityBenefit", v)} required />
                <EditTextarea label="Exclusivity Justification" value={editForm.exclusivityJustification} onChange={(v) => updateField("exclusivityJustification", v)} />
                <EditTextarea label="Engagement with Rainbow Wellington" value={editForm.engageRainbowWellington} onChange={(v) => updateField("engageRainbowWellington", v)} />
                <EditTextarea label="Promoting Rainbow Wellington" value={editForm.promoteRainbowWellington} onChange={(v) => updateField("promoteRainbowWellington", v)} />
                <EditTextarea label="Expected Outcomes" value={editForm.expectedOutcomes} onChange={(v) => updateField("expectedOutcomes", v)} />
                <EditTextarea label="Success Measurement" value={editForm.successMeasurement} onChange={(v) => updateField("successMeasurement", v)} />
              </div>
            ) : (
              <>
                <TextBlock label="Community Benefit" value={application.communityBenefit} />
                <TextBlock label="Exclusivity Justification" value={application.exclusivityJustification} className="mt-4" />
                <TextBlock label="Engagement with Rainbow Wellington" value={application.engageRainbowWellington} className="mt-4" />
                <TextBlock label="Promoting Rainbow Wellington" value={application.promoteRainbowWellington} className="mt-4" />
                <TextBlock label="Expected Outcomes" value={application.expectedOutcomes} className="mt-4" />
                <TextBlock label="Success Measurement" value={application.successMeasurement} className="mt-4" />
              </>
            )}
          </InfoSection>

          <InfoSection title="Additional Information">
            {editing ? (
              <div className="space-y-3">
                <EditField label="How they heard about us" value={editForm.howDidYouHear} onChange={(v) => updateField("howDidYouHear", v)} />
                <EditTextarea label="Additional notes" value={editForm.additionalInfo} onChange={(v) => updateField("additionalInfo", v)} />
              </div>
            ) : (
              (application.howDidYouHear || application.additionalInfo) ? (
                <>
                  <TextBlock label="How they heard about us" value={application.howDidYouHear} />
                  <TextBlock label="Additional notes" value={application.additionalInfo} className="mt-4" />
                </>
              ) : (
                <p className="text-sm text-gray-400">No additional information provided.</p>
              )
            )}
          </InfoSection>

          {application.uploadedFiles && (
            <InfoSection title="Uploaded Files">
              <UploadedFilesList filesJson={application.uploadedFiles} />
            </InfoSection>
          )}

          <InfoSection title="Admin Notes">
            {editing ? (
              <EditTextarea label="Notes" value={editForm.notes} onChange={(v) => updateField("notes", v)} />
            ) : (
              application.notes
                ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.notes}</p>
                : <p className="text-sm text-gray-400">No admin notes.</p>
            )}
          </InfoSection>

          <InfoSection title="Grant Administration">
            {editing ? (
              <div className="space-y-3">
                <EditField label="Amount Awarded ($)" value={editForm.amountAwarded} onChange={(v) => updateField("amountAwarded", v)} type="number" />
                <EditField label="Bank Account Name" value={editForm.bankAccountName} onChange={(v) => updateField("bankAccountName", v)} />
                <EditField label="Bank Account Number" value={editForm.bankAccountNumber} onChange={(v) => updateField("bankAccountNumber", v)} />
                <EditField label="Date Paid" value={editForm.datePaid} onChange={(v) => updateField("datePaid", v)} type="date" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.accountabilityReportReceived || false}
                    onChange={(e) => updateField("accountabilityReportReceived", e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Accountability Report Received</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.signedTermsAndConditions || false}
                    onChange={(e) => updateField("signedTermsAndConditions", e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Signed T&Cs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.outcomeInformed || false}
                    onChange={(e) => updateField("outcomeInformed", e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Outcome Informed</span>
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Post-Event Files (reports, posters, etc.)
                  </label>
                  <div className="space-y-2">
                    {postEventFiles.length > 0 && (
                      <ul className="space-y-2">
                        {postEventFiles.map((file) => (
                          <li
                            key={file.key}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">
                                {file.fileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePostEventFile(file.key)}
                              className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingPostEvent ? "Uploading..." : "Upload files"}
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handlePostEventUpload}
                        disabled={uploadingPostEvent}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.txt,.ppt,.pptx"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <InfoGrid>
                  <InfoItemAlways
                    icon={DollarSign}
                    label="Amount Awarded"
                    value={application.amountAwarded != null ? `$${application.amountAwarded.toLocaleString()}` : null}
                  />
                  <InfoItemAlways icon={User} label="Bank Account Name" value={application.bankAccountName} />
                  <InfoItemAlways icon={Building} label="Bank Account Number" value={application.bankAccountNumber} />
                  <InfoItemAlways icon={Calendar} label="Date Paid" value={application.datePaid} />
                </InfoGrid>
                <div className="mt-3 flex items-center gap-2">
                  <ClipboardCheck className={`w-4 h-4 ${application.accountabilityReportReceived ? "text-green-600" : "text-gray-300"}`} />
                  <span className="text-sm text-gray-700">
                    Accountability Report: {application.accountabilityReportReceived ? "Received" : "Not received"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ClipboardCheck className={`w-4 h-4 ${application.signedTermsAndConditions ? "text-green-600" : "text-gray-300"}`} />
                  <span className="text-sm text-gray-700">
                    Signed T&Cs: {application.signedTermsAndConditions ? "Yes" : "No"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ClipboardCheck className={`w-4 h-4 ${application.outcomeInformed ? "text-green-600" : "text-gray-300"}`} />
                  <span className="text-sm text-gray-700">
                    Outcome Informed: {application.outcomeInformed ? "Yes" : "No"}
                  </span>
                </div>
                {postEventFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Post-Event Files</p>
                    <UploadedFilesList filesJson={JSON.stringify(postEventFiles)} />
                  </div>
                )}
              </>
            )}
          </InfoSection>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Update Status
            </h3>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusClick(s.value)}
                  disabled={
                    updatingStatus || application.status === s.value
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    application.status === s.value
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-gray-600 hover:bg-gray-100 border border-transparent"
                  } disabled:opacity-50`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-indigo-600" />
              Funding Round
            </h3>
            <select
              value={application.fundingRoundId ?? ""}
              onChange={(e) => handleRoundChange(e.target.value)}
              disabled={assigningRound}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white disabled:opacity-50"
            >
              <option value="">Not assigned</option>
              {fundingRounds.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
            {application.fundingRoundId && (
              <Link
                to="/admin/rounds/$id"
                params={{ id: String(application.fundingRoundId) }}
                className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
              >
                View round details →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Comments ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-gray-700">
                          {comment.authorName}
                        </span>
                        {comment.authorEmail && comment.authorEmail !== comment.authorName && (
                          <span className="text-xs text-gray-400 truncate">
                            ({comment.authorEmail})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none mb-2"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingComment ? "Posting..." : "Add Comment"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            My Assessment
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-2">
                How Scoring Works
              </h3>
              <ul className="text-xs text-indigo-700 space-y-1">
                <li>Enter <strong>0&ndash;5</strong> for each criterion below</li>
                <li>Weights are already set per criterion</li>
                <li>Maximum possible score = <strong>500</strong></li>
                <li>Percentage normalises your score to <strong>100%</strong></li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                Notes for Reviewers
              </h3>
              <ol className="text-xs text-amber-800 space-y-1.5 list-decimal list-outside ml-3.5">
                <li><strong>Alignment with RW&rsquo;s Constitution &amp; Purpose:</strong> Projects must clearly benefit Rainbow communities in the Wellington region and align with RW&rsquo;s role as a membership association and registered charity focused on support, advocacy and community connection.</li>
                <li><strong>Community Benefit:</strong> Prioritise projects that reach many members, address identified gaps, or enhance wellbeing, visibility, inclusion, safety or capability for Rainbow people.</li>
                <li><strong>Engagement &amp; Membership:</strong> Projects that actively involve RW or promote membership growth should be rewarded in scoring.</li>
                <li><strong>Budget Justification:</strong> Be strict on ineligible costs &mdash; only award points when applicants clearly and convincingly justify discretionary items (like food/travel) or non-standard expenses.</li>
              </ol>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {ASSESSMENT_CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {criterion.label}{" "}
                  <span className="text-gray-400">(Weight: {criterion.weight})</span>
                </label>
                <select
                  value={myScores[criterion.key] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                    setMyScores((prev) => ({ ...prev, [criterion.key]: val }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Not scored</option>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Assessment Comments
            </label>
            <textarea
              value={assessmentComment}
              onChange={(e) => setAssessmentComment(e.target.value)}
              placeholder="Optional comments about this assessment..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
          <button
            onClick={handleSaveAssessment}
            disabled={savingAssessment}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {savingAssessment ? "Saving..." : "Save Assessment"}
          </button>
          {assessmentMessage && (
            <p className={`mt-2 text-sm ${assessmentMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {assessmentMessage.text}
            </p>
          )}
        </div>

        {assessments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              All Reviewer Scores
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Criterion
                    </th>
                    {assessments.map((a: any) => (
                      <th
                        key={a.id}
                        className="text-center px-3 py-2 font-medium text-gray-600"
                      >
                        {a.reviewerName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ASSESSMENT_CRITERIA.map((criterion) => (
                    <tr key={criterion.key}>
                      <td className="px-3 py-2 text-gray-700">
                        {criterion.label}
                        <span className="text-gray-400 ml-1 text-xs">
                          (x{criterion.weight})
                        </span>
                      </td>
                      {assessments.map((a: any) => {
                        const score = a[criterion.key];
                        return (
                          <td
                            key={a.id}
                            className="px-3 py-2 text-center"
                          >
                            {score != null ? (
                              <span className="font-medium text-gray-900">
                                {score}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Status Change
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Change status to{" "}
              <strong>
                {STATUSES.find((s) => s.value === pendingStatus)?.label}
              </strong>
              ?
            </p>

            {requiresReason(pendingStatus) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Reason {pendingStatus === "declined" ? "for declining" : "for requesting more info"}
                  </span>
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={
                    pendingStatus === "declined"
                      ? "Explain why this application was declined..."
                      : "Describe what additional information is needed..."
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be saved to the application notes{sendEmailOnChange ? " and included in the email" : ""}.
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailOnChange}
                onChange={(e) => setSendEmailOnChange(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Send email notification to {application.fullName} ({application.email})
              </span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPendingStatus(null)}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusConfirm}
                disabled={updatingStatus || (requiresReason(pendingStatus) && !statusReason.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Application
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to permanently delete this application?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{application.projectTitle}</strong> by {application.fullName}. This action cannot be undone and will also remove all associated comments.
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
                {deleting ? "Deleting..." : "Delete Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid sm:grid-cols-2 gap-3 ${className || ""}`}>
      {children}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function InfoItemAlways({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm ${value ? "text-gray-900" : "text-gray-300"}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function TextBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function UploadedFilesList({ filesJson }: { filesJson: string }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  let files: { key: string; fileName: string; contentType: string }[] = [];
  try {
    files = JSON.parse(filesJson);
  } catch {
    return <p className="text-sm text-gray-400">Unable to parse file data.</p>;
  }

  if (files.length === 0) return null;

  const handleDownload = async (key: string, fileName: string) => {
    setDownloading(key);
    try {
      const result = await getFileDownloadUrl({ data: { key } });
      if (!result) return;
      const byteChars = atob(result.base64Data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: result.contentType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li
          key={file.key}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">
              {file.fileName}
            </span>
          </div>
          <button
            onClick={() => handleDownload(file.key, file.fileName)}
            disabled={downloading === file.key}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0 ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading === file.key ? "..." : "Download"}
          </button>
        </li>
      ))}
    </ul>
  );
}

function EditField({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
}

function EditTextarea({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
      />
    </div>
  );
}
