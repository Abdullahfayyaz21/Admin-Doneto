import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { cookies } from 'next/headers';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sidebarCollapsed = cookieStore.get('sidebar_collapsed')?.value === 'true';

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 dark:bg-background">
      <Sidebar initialCollapsed={sidebarCollapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
