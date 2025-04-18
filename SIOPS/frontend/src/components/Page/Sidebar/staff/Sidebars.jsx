import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  PackageSearch,
  ClipboardList,
  LogOut,
} from "lucide-react";
import axios from "axios";

const Sidebars = ({ isSidebarOpen, isDesktopSidebarOpen }) => {
  const navigate = useNavigate();

  // Data untuk Sidebar
  const Fiturs = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      text: "Dashboard",
    },
    {
      to: "#",
      icon: Package,
      text: "Stok",
    },
    {
      to: "/order",
      icon: ShoppingCart,
      text: "Order",
    },
    {
      to: "#",
      icon: PackageSearch,
      text: "Opname",
    },
  ];

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      // Call logout endpoint to invalidate token
      await axios.post('http://localhost:5000/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Clear local storage
      localStorage.removeItem('token');
      
      // Redirect to login page using navigate
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still remove token and redirect on error
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const shortcutLink = [
    {
      to: "/report",
      title: "Report",
      icon: ClipboardList,
    },
    {
      to: "/settings",
      title: "Settings",
      icon: Settings,
    },
    {
      to: "#",
      title: "Logout",
      icon: LogOut,
      onClick: handleLogout
    },
  ];

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen transition-transform",
        "bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700",
        {
          "-translate-x-full md:translate-x-0": !isSidebarOpen && isDesktopSidebarOpen,
          "-translate-x-full": !isSidebarOpen && !isDesktopSidebarOpen,
          "translate-x-0": isSidebarOpen,
        }
      )}
      aria-label="Sidebar"
    >
      {/* Menu */}
      <div className="flex-1 px-4 py-4 overflow-y-auto mt-20">
        <h2 className="px-4 text-sm -mx-3 mb-3 font-semibold text-gray-500 dark:text-gray-400">
          MENU
        </h2>
        <ul className="space-y-2 font-medium">
          {Fiturs.map((item, index) => (
            <li key={index}>
              {item.to === "#" ? (
                <a
                  href="#"
                  className="flex items-center px-4 py-2 text-gray-950 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                  onClick={(e) => e.preventDefault()}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="ml-3">{item.text}</span>
                </a>
              ) : (
                <Link
                  to={item.to}
                  className="flex items-center px-4 py-2 text-gray-950 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="ml-3">{item.text}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Shortcuts */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <h2 className="px-4 text-sm -mx-3 mb-3 font-semibold text-gray-500 dark:text-gray-400">
          OTHER
        </h2>
        <ul className="mt-2 space-y-2">
          {shortcutLink.map((shortcut, index) => (
            <li key={index}>
              {shortcut.onClick ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    shortcut.onClick();
                  }}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                >
                  <shortcut.icon className="w-5 h-5" />
                  <span className="ml-3">{shortcut.title}</span>
                </a>
              ) : (
                <Link
                  to={shortcut.to}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                >
                  <shortcut.icon className="w-5 h-5" />
                  <span className="ml-3">{shortcut.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebars;
