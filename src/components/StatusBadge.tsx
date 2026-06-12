const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-800" },
  under_review: {
    label: "Under Review",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  more_info_needed: {
    label: "More Info Needed",
    bg: "bg-orange-100",
    text: "text-orange-800",
  },
  declined: { label: "Declined", bg: "bg-red-100", text: "text-red-800" },
  approved: {
    label: "Approved",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  paid: {
    label: "Paid",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  completed: {
    label: "Completed",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

export const STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "more_info_needed", label: "More Info Needed" },
  { value: "declined", label: "Declined" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "completed", label: "Completed" },
];
