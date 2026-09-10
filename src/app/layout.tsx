import "@/app/globals.css";
import "@/app/hc-theme.css";
import AuthWrapper from "@/components/AuthWrapper";

export const metadata = {
  title: "Indian School Management System",
  description: "Multi-tenant School Management System featuring Pre-Primary, School Section, Junior College, Fee Desk, GR Tracking & Thermal/A4 Printable Receipts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen hc-root antialiased flex flex-col selection:bg-blue-600 selection:text-white">
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
