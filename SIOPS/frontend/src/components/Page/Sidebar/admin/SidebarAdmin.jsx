import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PackageSearch,
  ClipboardList,
  ShoppingBag,
  ChevronRight,
  Bell,
  Globe,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const SidebarAdmin = ({ isSidebarOpen, isDesktopSidebarOpen }) => {
  const location = useLocation();
 
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Order",
      message: "New order received",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Stock Alert",
      message: "Low stock warning",
      time: "5 min ago",
      unread: true,
    },
  ]);

  const notificationRef = useRef(null);
  const languageRef = useRef(null);

  // Data untuk Sidebar dengan penambahan warna
  const Fiturs = [
    {
      href: "/DashboardAdmin",
      icon: LayoutDashboard,
      text: "Dashboard",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      href: "/product",
      icon: Package,
      text: "Product",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      href: "/orderAdmin",
      icon: ShoppingBag,
      text: "Order",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      href: "/sales",
      icon: ShoppingCart,
      text: "Sales",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      href: "/opname",
      icon: PackageSearch,
      text: "Opname",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      href: "/import",
      icon: ClipboardList,
      text: "Report",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  // Fungsi untuk mapping hover background dan text
  function getSidebarHoverClass(text) {
    switch (text) {
      case "Dashboard":
        return { bg: "hover:bg-blue-50", text: "hover:text-blue-600" };
      case "Product":
        return { bg: "hover:bg-green-50", text: "hover:text-green-600" };
      case "Order":
        return { bg: "hover:bg-purple-50", text: "hover:text-purple-600" };
      case "Sales":
        return { bg: "hover:bg-orange-50", text: "hover:text-orange-600" };
      case "Opname":
        return { bg: "hover:bg-teal-50", text: "hover:text-teal-600" };
      case "Report":
        return { bg: "hover:bg-red-50", text: "hover:text-red-600" };
      default:
        return { bg: "hover:bg-gray-50", text: "hover:text-gray-900" };
    }
  }

  // Fungsi untuk mapping hover icon
  function getSidebarIconHoverClass(text) {
    switch (text) {
      case "Dashboard":
        return "group-hover:text-blue-600";
      case "Product":
        return "group-hover:text-green-600";
      case "Order":
        return "group-hover:text-purple-600";
      case "Sales":
        return "group-hover:text-orange-600";
      case "Opname":
        return "group-hover:text-teal-600";
      case "Report":
        return "group-hover:text-red-600";
      default:
        return "group-hover:text-gray-900";
    }
  }

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300",
        "bg-white dark:bg-gray-800 shadow-lg border-r border-gray-100 dark:border-gray-700",
        {
          "-translate-x-full md:translate-x-0":
            !isSidebarOpen && isDesktopSidebarOpen,
          "-translate-x-full": !isSidebarOpen && !isDesktopSidebarOpen,
          "translate-x-0": isSidebarOpen,
        }
      )}
      aria-label="Sidebar"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 mt-4">
        <div className="flex items-center space-x-3"></div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-6">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-4 px-3">
          Menu
        </h2>
        <nav className="space-y-1">
          {Fiturs.map((item, index) => {
            const isActive = location.pathname === item.href;
            const hover = getSidebarHoverClass(item.text);
            const iconHover = getSidebarIconHoverClass(item.text);
            return (
              <a
                key={index}
                href={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                  ${
                    isActive
                      ? `${item.bgColor} ${item.color} shadow-sm border border-opacity-20`
                      : `text-gray-600 dark:text-gray-300 ${hover.bg} ${hover.text}`
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg mr-3 transition-colors duration-200
                  ${
                    isActive
                      ? `${item.color} bg-white shadow-sm`
                      : `text-gray-400 ${iconHover} group-hover:bg-white group-hover:shadow-sm`
                  }
                `}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="flex-1">{item.text}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer with Language, Dark Mode, and Notifications */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
          <div className="flex items-center justify-between">
            {" "}
            {/* Language Selector */}
           
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 relative"
              >
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                {notifications.some((n) => n.unread) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute bottom-full mb-2 right-0 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-100 dark:border-gray-600">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                          notification.unread
                            ? "bg-blue-50 dark:bg-gray-600"
                            : ""
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
