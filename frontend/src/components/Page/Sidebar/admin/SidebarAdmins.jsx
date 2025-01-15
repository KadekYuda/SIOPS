import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Users,
  PackageSearch,
  Target,
  PieChart,
  LineChart,
} from "lucide-react";

const SidebarAdmin = ({ isSidebarOpen }) => {
  // Data untuk Sidebar
  const Fiturs = [
    {
      href: "/DashboardAdmin",
      icon: LayoutDashboard,
      text: "Dashboard",
    },
    {
      href: "users",
      icon: Users,
      text: "Users",
    },
    {
      href: "#",
      icon: Package,
      text: "Stok",
    },
    {
      href: "order",
      icon: ShoppingCart,
      text: "Order",
    },
    {
      href: "",
      icon: PackageSearch,
      text: "Opname",
    },
  ];

  const shortcutLink = [
    {
      title: "Goals",
      icon: Target,
    },
    {
      title: "Plan",
      icon: PieChart,
    },
    {
      title: "Stats",
      icon: LineChart,
    },
    {
      title: "Setting",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200",
        "dark:bg-gray-800 dark:border-gray-700 transition-transform",
        {
          "translate-x-0": isSidebarOpen,
          "-translate-x-full": !isSidebarOpen,
        }
      )}
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

      {/* Shortcuts */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <h2 className="px-4 text-sm -mx-3 mb-3 font-semibold text-gray-500 dark:text-gray-400">
          Shortcuts
        </h2>
        <ul className="mt-2 space-y-2">
          {shortcutLink.map((shortcut, index) => (
            <li key={index}>
              <button className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg">
                <shortcut.icon className="w-5 h-5" />
                <span className="ml-3">{shortcut.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SidebarAdmin;
