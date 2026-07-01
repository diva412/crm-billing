import AppShell from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AppShell title="Dashboard">{children}</AppShell>
    </ToastProvider>
  );
}
