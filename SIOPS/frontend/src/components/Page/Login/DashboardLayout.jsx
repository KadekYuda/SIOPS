import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../Sidebar/admin/SidebarAdmin";
import Sidebars from "../Sidebar/staff/Sidebars";
import Headers from "../Sidebar/Headers";
import api from "../../../service/api";
import MinStockAlert from "../../modal/MinStockAlert";


const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);


  // Fetch user data dari server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/verify-token', );
        
        if (response.data.user && response.data.user.role) {
          setRole(response.data.user.role);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Redirect ke halaman login jika unauthorized
        if (error.response?.status === 401 || error.response?.status === 403) {
        window.location.href = '/login';
      }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Toggle untuk Mobile Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Toggle untuk Desktop Sidebar
  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => !prev);
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

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

  if (loading) {
    return <div>Loading...</div>; // Tambahkan loading indicator
  }

  return (
    <div
      className={clsx(
        "flex min-h-screen relative",
        darkMode ? "dark bg-gray-900" : "bg-gray-100"
      )}
    >
      {/* Overlay untuk mobile */}
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
            "translate-x-0": isSidebarOpen,
            "-translate-x-full": !isSidebarOpen,
            "lg:translate-x-0": isDesktopSidebarOpen,
            "lg:-translate-x-full": !isDesktopSidebarOpen,
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
            toggleSidebar={toggleSidebar}
            toggleDesktopSidebar={toggleDesktopSidebar}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={clsx(
            "flex-1 p-4 transition-all duration-300 ease-in-out",
            {
              "lg:ml-64": isDesktopSidebarOpen,
              "lg:ml-0": !isDesktopSidebarOpen,
            }
          )}
        >
          <main className="h-full">
            <Outlet />
            <MinStockAlert />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;