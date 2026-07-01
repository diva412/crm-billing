interface StatusBadgeProps {
  status: string;
}

const LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted",
  LOST: "Lost",
  PENDING: "Pending",
  COMPLETED: "Completed",
  MISSED: "Missed",
  CURRENT: "Current",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{LABELS[status] ?? status}</span>;
}
