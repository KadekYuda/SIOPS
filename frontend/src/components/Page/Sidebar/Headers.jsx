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
            {/* Hanya tampilkan icon Menu di halaman yang tidak ada di excludedPaths */}

            <button
              className={clsx(
                "inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden",
                "hover:bg-gray-100 focus:ring-gray-200",
                "dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              )}
              onClick={toggleSidebar}
            >
              <Menu className="text-2xl" />
            </button>

            <a href="/#" className="flex items-center space-x-2">
              <img src={Logo2} alt="Logo" width="60" height="50" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                SIOPS
              </span>
            </a>
            <button
              className={clsx(
                menuActive ? "" : "mx-20",
                "items-center p-2 text-sm text-gray-500 rounded-lg hidden lg:block",
                "hover:bg-gray-100 focus:ring-gray-200",
                "dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              )}
              onClick={() => {
                toggleDesktopSidebar(); // Fungsi untuk toggle sidebar
                setMenuActive(!menuActive); // Toggle state margin
              }}
            >
              <Menu className="text-2xl" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {/* Tampilkan tombol Login hanya di halaman yang ada di excludedPaths */}

            <a
              href="/"
              className="text-lg font-bold text-black dark:text-gray-300"
            >
              <button className="flex items-center justify-center space-x-2 dark:bg-white w-10 h-10 rounded-full shadow-md">
                <User size={24} className="dark:text-black" />
              </button>
            </a>

            <button
              className="dark:bg-slate-50 dark:text-slate-700 rounded-full p-2 font-bold"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun /> : <Moon />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Headers;
