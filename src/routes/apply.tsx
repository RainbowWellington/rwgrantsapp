import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { submitApplication } from "../server/applications.js";
import { uploadFile } from "../server/uploads.js";
import { Send, CheckCircle, ArrowLeft, Upload, X, FileText } from "lucide-react";

export const Route = createFileRoute("/apply")({
  component: ApplyPage,
});

const ORG_TYPES = [
  "Individual",
  "Community Group",
  "Non-Profit / Charity",
  "School / Educational Institution",
  "Government Agency",
  "Other",
];

const HEAR_OPTIONS = [
  "Website",
  "Social Media",
  "Word of Mouth",
  "Email Newsletter",
  "Community Event",
  "Other",
];

function ApplyPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    { key: string; fileName: string; contentType: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [budgetFiles, setBudgetFiles] = useState<
    { key: string; fileName: string; contentType: string }[]
  >([]);
  const [uploadingBudget, setUploadingBudget] = useState(false);
  const [amountRequested, setAmountRequested] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

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
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (err: any) {
      setError(err.message || "Failed to upload file(s). Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const handleBudgetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingBudget(true);
    setError("");

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
      setBudgetFiles((prev) => [...prev, ...newFiles]);
    } catch (err: any) {
      setError(err.message || "Failed to upload budget file. Please try again.");
    } finally {
      setUploadingBudget(false);
      e.target.value = "";
    }
  };

  const removeBudgetFile = (key: string) => {
    setBudgetFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      await submitApplication({
        data: {
          fullName: fd.get("fullName") as string,
          email: fd.get("email") as string,
          phone: (fd.get("phone") as string) || undefined,
          organizationName:
            (fd.get("organizationName") as string) || undefined,
          organizationType:
            (fd.get("organizationType") as string) || undefined,
          roleInOrganization:
            (fd.get("roleInOrganization") as string) || undefined,
          organizationWebsite:
            (fd.get("organizationWebsite") as string) || undefined,
          projectOrganizer:
            (fd.get("projectOrganizer") as string) || undefined,
          projectOrganisationMethod:
            (fd.get("projectOrganisationMethod") as string) || undefined,
          projectTitle: fd.get("projectTitle") as string,
          projectDescription: fd.get("projectDescription") as string,
          projectStartDate:
            (fd.get("projectStartDate") as string) || undefined,
          projectEndDate: (fd.get("projectEndDate") as string) || undefined,
          projectLocation: (fd.get("projectLocation") as string) || undefined,
          targetAudience: (fd.get("targetAudience") as string) || undefined,
          expectedBeneficiaries:
            (fd.get("expectedBeneficiaries") as string) || undefined,
          grantAmountRequested: parseInt(
            fd.get("grantAmountRequested") as string,
            10
          ),
          totalProjectBudget:
            parseInt(fd.get("totalProjectBudget") as string, 10) || undefined,
          budgetBreakdown: (fd.get("budgetBreakdown") as string) || undefined,
          otherFundingSources:
            (fd.get("otherFundingSources") as string) || undefined,
          previousFunding: fd.get("previousFunding") === "yes",
          previousFundingDetails:
            (fd.get("previousFundingDetails") as string) || undefined,
          communityBenefit: fd.get("communityBenefit") as string,
          exclusivityJustification:
            (fd.get("exclusivityJustification") as string) || undefined,
          engageRainbowWellington:
            (fd.get("engageRainbowWellington") as string) || undefined,
          promoteRainbowWellington:
            (fd.get("promoteRainbowWellington") as string) || undefined,
          expectedOutcomes:
            (fd.get("expectedOutcomes") as string) || undefined,
          successMeasurement:
            (fd.get("successMeasurement") as string) || undefined,
          howDidYouHear: (fd.get("howDidYouHear") as string) || undefined,
          additionalInfo: (fd.get("additionalInfo") as string) || undefined,
          uploadedFiles:
            uploadedFiles.length > 0
              ? JSON.stringify(uploadedFiles)
              : undefined,
          budgetFile:
            budgetFiles.length > 0
              ? JSON.stringify(budgetFiles)
              : undefined,
        },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-lg w-full text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your application. A confirmation email has been sent
            to your email address. We will review your application and get back
            to you soon.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setError("");
            }}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grant Application
          </h1>
          <p className="text-gray-600">
            Complete the form below to apply for a community grant.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Contact Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="fullName" required />
              <Field label="Email Address" name="email" type="email" required />
              <Field label="Phone Number" name="phone" type="tel" />
            </div>
          </Section>

          <Section title="Organisation Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Organisation / Group Name" name="organizationName" />
              <SelectField
                label="Organisation Type"
                name="organizationType"
                options={ORG_TYPES}
              />
              <Field label="Your Role in Organisation" name="roleInOrganization" />
              <Field
                label="Organisation Website"
                name="organizationWebsite"
                type="url"
                placeholder="https://"
              />
            </div>
          </Section>

          <Section title="Project / Event Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Project / Event Name"
                name="projectTitle"
                required
                className="sm:col-span-2"
              />
              <TextareaField
                label="Project Description"
                name="projectDescription"
                required
                className="sm:col-span-2"
                placeholder="Describe your project or event, its goals, and who it serves..."
              />
              <TextareaField
                label="Who is organising the project or event?"
                name="projectOrganizer"
                className="sm:col-span-2"
                placeholder="Describe who is responsible for organising this project or event..."
              />
              <TextareaField
                label="How is the project being organised?"
                name="projectOrganisationMethod"
                className="sm:col-span-2"
                placeholder="Describe how the project or event is being organised..."
              />
              <Field
                label="Start Date"
                name="projectStartDate"
                type="date"
              />
              <Field label="End Date" name="projectEndDate" type="date" />
              <Field
                label="Project, Event or Activity Location"
                name="projectLocation"
                className="sm:col-span-2"
              />
              <TextareaField
                label="Target Audience"
                name="targetAudience"
                className="sm:col-span-2"
                placeholder="Who will benefit from this project?"
              />
              <Field
                label="Expected Number of Participants / Beneficiaries"
                name="expectedBeneficiaries"
              />
            </div>
          </Section>

          <Section title="Funding Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Amount Requested ($)"
                name="grantAmountRequested"
                type="number"
                required
                min="1"
                onChange={(v) => setAmountRequested(parseInt(v, 10) || 0)}
              />
              <Field
                label="Total Project Budget ($)"
                name="totalProjectBudget"
                type="number"
                min="0"
              />
              {amountRequested >= 500 && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Please upload your project or activity budget
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="space-y-3">
                    {budgetFiles.length > 0 && (
                      <ul className="space-y-2">
                        {budgetFiles.map((file) => (
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
                              onClick={() => removeBudgetFile(file.key)}
                              className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingBudget ? "Uploading..." : "Click to upload budget file"}
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleBudgetUpload}
                        disabled={uploadingBudget}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.csv,.txt"
                      />
                    </label>
                    {budgetFiles.length === 0 && (
                      <input
                        type="text"
                        required
                        className="sr-only"
                        tabIndex={-1}
                        value=""
                        onChange={() => {}}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              )}
              <TextareaField
                label="Budget Breakdown"
                name="budgetBreakdown"
                className="sm:col-span-2"
                placeholder="How will the grant funding be spent? List the main budget items..."
              />
              <TextareaField
                label="Other Funding Sources"
                name="otherFundingSources"
                className="sm:col-span-2"
                placeholder="List any other funding sources for this project..."
              />
              <SelectField
                label="Have you received funding from us before?"
                name="previousFunding"
                options={["No", "Yes"]}
                values={["no", "yes"]}
              />
              <TextareaField
                label="If yes, please provide details"
                name="previousFundingDetails"
                className="sm:col-span-2"
              />
            </div>
          </Section>

          <Section title="Impact & Outcomes">
            <div className="space-y-4">
              <TextareaField
                label="How will this project benefit the community?"
                name="communityBenefit"
                required
                placeholder="Describe the positive impact this project will have..."
              />
              <TextareaField
                label="If the activity is exclusive to certain groups, please include justification"
                name="exclusivityJustification"
                placeholder="Explain why the activity is limited to specific groups, if applicable..."
              />
              <TextareaField
                label="How will you engage with Rainbow Wellington and our members?"
                name="engageRainbowWellington"
                placeholder="Describe how you plan to engage with Rainbow Wellington and our members..."
              />
              <TextareaField
                label="How will you promote Rainbow Wellington?"
                name="promoteRainbowWellington"
                placeholder="Describe how you will promote Rainbow Wellington through this project..."
              />
              <TextareaField
                label="What outcomes do you expect?"
                name="expectedOutcomes"
                placeholder="What specific results do you aim to achieve?"
              />
              <TextareaField
                label="How will you measure success?"
                name="successMeasurement"
                placeholder="What metrics or indicators will you use?"
              />
            </div>
          </Section>

          <Section title="Additional Information">
            <div className="space-y-4">
              <SelectField
                label="How did you hear about this grant?"
                name="howDidYouHear"
                options={HEAR_OPTIONS}
              />
              <TextareaField
                label="Is there anything else you'd like us to know?"
                name="additionalInfo"
              />
            </div>
          </Section>

          <Section title="Supporting Documents">
            <p className="text-sm text-gray-600 mb-4">
              Upload any supporting files such as budgets, PDFs, posters, or
              images. Accepted formats: PDF, Word, Excel, images, and other
              common file types.
            </p>
            <div className="space-y-3">
              {uploadedFiles.length > 0 && (
                <ul className="space-y-2">
                  {uploadedFiles.map((file) => (
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
                        onClick={() => removeFile(file.key)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? "Uploading..." : "Click to upload files"}
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.txt,.ppt,.pptx"
                />
              </label>
            </div>
          </Section>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I declare that the information provided in this application is
                true and correct to the best of my knowledge. I understand that
                providing false information may result in the application being
                declined or funding being revoked. You also agree to our{" "}
                <a
                  href="https://rainbowwellington.org.nz/grant-terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline hover:text-indigo-800"
                >
                  Grants Policy
                </a>{" "}
                and{" "}
                <a
                  href="https://rainbowwellington.org.nz/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline hover:text-indigo-800"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading || uploadingBudget}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className,
  min,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors resize-y"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  values,
  required,
  className,
}: {
  label: string;
  name: string;
  options: string[];
  values?: string[];
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors bg-white"
      >
        <option value="">Select...</option>
        {options.map((opt, i) => (
          <option key={opt} value={values ? values[i] : opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
