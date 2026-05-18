import { STATUS_LABELS, STATUS_COLORS } from "../lib/constants";
import type { ApplicationStatus } from "../lib/types";

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
