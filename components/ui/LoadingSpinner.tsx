export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <svg
        width={size} height={size}
        viewBox="0 0 24 24"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" fill="none" />
        <path d="M12 2 a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
