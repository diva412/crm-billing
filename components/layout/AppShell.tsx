import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        <main className="page-body">{children}</main>
      </div>
    </>
  );
}
