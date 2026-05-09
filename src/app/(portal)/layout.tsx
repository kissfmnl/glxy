import Sidebar from "@/components/Sidebar";
import { PortalLightMode } from "@/components/PortalLightMode";
import { AdminSaveToast } from "@/components/portal/AdminSaveToast";
import { Suspense } from "react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalLightMode />
      <Sidebar />
      <main
        className="portal-main min-h-screen px-4 pb-8 pt-16 transition-all duration-300 sm:px-6 lg:ml-64 lg:pb-10 lg:pt-6"
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <AdminSaveToast />
      </Suspense>
    </>
  );
}

