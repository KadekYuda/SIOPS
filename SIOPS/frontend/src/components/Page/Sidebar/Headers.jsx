import { useState } from "react";
import clsx from "clsx";
import { Moon, Sun, Menu, User } from "lucide-react";
import Logo2 from "../../../assets/Logo2.png";

const Headers = ({ darkMode, toggleDarkMode, toggleSidebar, toggleDesktopSidebar }) => {
  const [menuActive, setMenuActive] = useState(false);

  return (
    <nav
      className={clsx(
        "fixed top-0 z-50 w-full bg-white",
        "border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      )}
    >
      <div className="px-2 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start rtl:justify-end">
            {/* Mobile menu button */}
            <button
              data-drawer-target="logo-sidebar"
              data-drawer-toggle="logo-sidebar"
              aria-controls="logo-sidebar"
              type="button"
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <a href="/#" className="flex items-center space-x-2 ml-2">
              <img src={Logo2} alt="Logo" width="60" height="50" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                SIOPS
              </span>
            </a>

            {/* Desktop menu button */}
            <button
              className={clsx(
                menuActive ? "" : "mx-20",
                "items-center p-2 text-sm text-gray-500 rounded-lg hidden lg:inline-flex",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200",
                "dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              )}
              onClick={() => {
                toggleDesktopSidebar();
                setMenuActive(!menuActive);
              }}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center">
            <a
              href="/"
              className="text-lg font-bold text-black dark:text-gray-300"
            >
              <button className="flex items-center justify-center space-x-2 dark:bg-white w-10 h-10 rounded-full shadow-md">
                <User size={24} className="dark:text-black" />
              </button>
            </a>

            <button
              onClick={toggleDarkMode}
              type="button"
              className="flex items-center justify-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 ml-2"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Headers;
