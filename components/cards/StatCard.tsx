interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  color?: string;
}

export default function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="stat-card" style={color ? { borderTop: `3px solid ${color}` } : {}}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
