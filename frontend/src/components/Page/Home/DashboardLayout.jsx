import React, { useState } from "react";
import clsx from "clsx";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../Sidebar/admin/SidebarAdmin"; // Admin Sidebar
import Sidebars from "../Sidebar/staff/Sidebars"; // Staff Sidebar
import Headers from "../Sidebar/Headers"; // Header Component

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop Sidebar
  const role = localStorage.getItem("role"); // Ambil role dari localStorage
  const SidebarComponent = role === "admin" ? SidebarAdmin : Sidebars;

  // Toggle untuk Mobile Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Toggle untuk Desktop Sidebar
  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => !prev);
  };

  // Toggle untuk Dark Mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div
      className={clsx(
        "flex min-h-screen",
        darkMode ? "dark bg-gray-900" : "bg-gray-100"
      )}
    >
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed z-40 inset-y-0 left-0 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out",
          {
            "translate-x-0 w-64": isSidebarOpen, // Mobile Sidebar Open
            "-translate-x-full hidden lg:block": !isSidebarOpen, // Mobile Sidebar Closed
            "lg:translate-x-0 lg:w-64": isDesktopSidebarOpen, // Desktop Sidebar Open
            "lg:-translate-x-full": !isDesktopSidebarOpen, // Desktop Sidebar Closed
          }
        )}
      >
        <SidebarComponent
          isSidebarOpen={isSidebarOpen}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Header */}
      <div className={`${darkMode && "dark"}`}>
        <Headers
          toggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
          toggleSidebar={toggleSidebar} // Mobile
          toggleDesktopSidebar={toggleDesktopSidebar} // Desktop
        />
        </div>

        {/* Main Content Area */}
        <div
          className={clsx(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden p-4",
            {
              "lg:ml-64": isDesktopSidebarOpen, // Geser konten saat Desktop Sidebar terbuka
              "lg:ml-0": !isDesktopSidebarOpen, // Konten normal saat Desktop Sidebar tertutup
            }
          )}
        >
          <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
  
      