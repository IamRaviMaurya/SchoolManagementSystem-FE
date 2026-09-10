export const metadata = {
  title: "Super Admin Platform | Indian School Management System",
};

// The shared high-contrast AppShell (sidebar + topbar) is applied by AuthWrapper.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
