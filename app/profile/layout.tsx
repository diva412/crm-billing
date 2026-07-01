import AppShell from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToastProvider><AppShell title="My Profile">{children}</AppShell></ToastProvider>;
}