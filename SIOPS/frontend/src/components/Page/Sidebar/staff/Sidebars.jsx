import React from 'react';
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  PackageSearch,
  ClipboardList,
} from "lucide-react";

const Sidebars = ({ isSidebarOpen, isDesktopSidebarOpen }) => {
  

  // Data untuk Sidebar
  const Fiturs = [
    {
      href: "/DashboardAdmin",
      icon: LayoutDashboard,
      text: "Dashboard",
    },
    
    {
      href: "/product",
      icon: Package,
      text: "Product",
    },
    {
      href: "order",
      icon: ShoppingBag,
      text: "Order",
    },
    {
      href: "sales",
      icon: ShoppingCart,
      text: "Sales",
    },

    {
      href: "opname",
      icon: PackageSearch,
      text: "Opname",
    },
    {
      href: "/report",
      icon:ClipboardList,
      text: "Report",
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
              <a
                href={item.href}
                className="flex items-center px-4 py-2 text-gray-950 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
              >
                <item.icon className="w-5 h-5" />
                <span className="ml-3">{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      
    </aside>
  );
};

export default Sidebars;
