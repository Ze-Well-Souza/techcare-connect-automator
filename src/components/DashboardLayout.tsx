
import React from "react";
import { Outlet } from "react-router-dom";
import MainSidebar from "./MainSidebar";
import AssistantButton from "./ai/AssistantButton";
import { SidebarProvider } from "./ui/sidebar";

const DashboardLayout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <MainSidebar />
        <div className="flex-1 p-8 overflow-auto">
          <main className="max-w-7xl mx-auto">
            <Outlet />
          </main>
          <AssistantButton />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
