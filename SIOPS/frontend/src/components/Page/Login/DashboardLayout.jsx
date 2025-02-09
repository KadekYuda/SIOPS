import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../Sidebar/admin/SidebarAdmin"; // Admin Sidebar
import Sidebars from "../Sidebar/staff/Sidebars"; // Staff Sidebar
import Headers from "../Sidebar/Headers"; // Header Component

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Sidebar
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop Sidebar

  // Get role from token instead of localStorage
  const [role, setRole] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        setRole(userData.role);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

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

  // Close mobile sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SidebarComponent = role === "admin" ? SidebarAdmin : Sidebars;

  return (
    <div
      className={clsx(
        "flex min-h-screen relative",
        darkMode ? "dark bg-gray-900" : "bg-gray-100"
      )}
    >
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed z-40 inset-y-0 left-0 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out w-64",
          {
            "translate-x-0": isSidebarOpen, // Mobile Sidebar Open
            "-translate-x-full": !isSidebarOpen, // Mobile Sidebar Closed
            "lg:translate-x-0": isDesktopSidebarOpen, // Desktop Sidebar Open
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={clsx("sticky top-0 z-40", darkMode && "dark")}>
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
            "flex-1 p-4 transition-all duration-300 ease-in-out",
            {
              "lg:ml-64": isDesktopSidebarOpen, // Geser konten saat Desktop Sidebar terbuka
              "lg:ml-0": !isDesktopSidebarOpen, // Konten normal saat Desktop Sidebar tertutup
            }
          )}
        >
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;