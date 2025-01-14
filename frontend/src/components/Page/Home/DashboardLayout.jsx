import React, { useState } from "react";
import clsx from "clsx";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../Sidebar/admin/SidebarAdmin"; // Admin Sidebar
import Sidebars from "../Sidebar/staff/Sidebars"; // Staff Sidebar
import Headers from "../Sidebar/Headers"; // Header Component

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar default terbuka
  const role = localStorage.getItem("role"); // Ambil role dari localStorage
  const SidebarComponent = role === "admin" ? SidebarAdmin : Sidebars;

  // Fungsi untuk toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div
        className={clsx(
          "fixed z-40 inset-y-0 left-0 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full", // Mobile
          "lg:translate-x-0 lg:w-64", // Desktop: Sidebar default terbuka
          !isSidebarOpen && "hidden lg:w-0" // Jika tertutup di desktop
        )}
      >
        <SidebarComponent
          isSidebarOpen={isSidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Mobile Header with Hamburger Menu */}
      <div className={`${darkMode && "dark"}`}>
        a
        <Headers
          toggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
          toggleSidebar={toggleSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={clsx(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0" // Geser main content jika sidebar terbuka
        )}
      >
        {/* Main Content */}
        <main className="flex-1 p-4 ">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
