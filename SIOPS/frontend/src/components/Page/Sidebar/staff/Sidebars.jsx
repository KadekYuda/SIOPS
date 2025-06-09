import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PackageSearch,
  ClipboardList,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../../../service/api";

const Sidebars = ({ isSidebarOpen, isDesktopSidebarOpen }) => {
  const location = useLocation();
  const [userData, setUserData] = useState({
    name: "",
    role: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        const profileData = response.data.user ?? response.data;
        setUserData({
          name: profileData.name || "Admin",
          role: profileData.role || "Administrator",
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Data untuk Sidebar
  const Fiturs = [
    {
      href: "/Dashboard",
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
      href: "/order",
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
      href: "/opnames",
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

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300",
        "bg-white shadow-lg border-r border-gray-100",
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
      <div className="p-6 border-b border-gray-100 mt-4">
        <div className="flex items-center space-x-3"></div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
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
                      : `text-gray-600 ${hover.bg} ${hover.text}`
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

      {/* Footer with Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userData.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{userData.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebars;
