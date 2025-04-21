import React, { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
import {
  Moon,
  Sun,
  Menu,
  User,
  UserCircle,
  LogOut,
  Settings,
} from "lucide-react";
import LogoAM1 from "../../../assets/LogoAM1.png";
import { useNavigate } from "react-router-dom";
import api from "../../../service/api";

const Headers = ({
  darkMode,
  toggleDarkMode,
  toggleSidebar,
  toggleDesktopSidebar,
}) => {
  const [menuActive, setMenuActive] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [userData, setUserData] = useState(null); 
  const dropdownRef = useRef(null);
  const navigate = useNavigate();


  const fetchUserProfile = useCallback(async () => {
    try {
      // Kirim permintaan tanpa header Authorization karena token sudah ada di cookie
      const response = await api.get("/users/profile",);

      setUserData(response.data.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout", null, );
      
      setUserData(null); // Reset state user
      navigate("/login"); // Pindah ke halaman login
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setUserDropdown((prev) => !prev);
  };

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
            <a href="/#" className="flex items-center space-x-2 ml-2 my-2">
              <img src={LogoAM1} alt="Logo" width="60" height="50" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                SIMSOP
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
            {/* Theme toggle button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {darkMode ? (
                <Sun className="w-6 h-6" />
              ) : (
                <Moon className="w-6 h-6" />
              )}
            </button>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className={clsx(
                  "flex items-center justify-center ml-2",
                  "w-10 h-10 rounded-full shadow-md transition-colors duration-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  "bg-white dark:bg-gray-800",
                  userDropdown && "ring-2 ring-blue-500"
                )}
              >
                <User size={24} className="text-gray-600 dark:text-gray-300" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-[100]">
                  {userData ? (
                    <>
                      <div className="p-4 border-b dark:border-gray-700 flex items-center">
                        <UserCircle
                          size={40}
                          className="mr-3 text-gray-500 dark:text-gray-400"
                        />
                        <div>
                          <p className="text-sm font-semibold dark:text-white">
                            {userData.name || "User Name"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {userData.role || "Role"}
                          </p>
                        </div>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate("/userprofile");
                            setUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-white"
                        >
                          <UserCircle
                            size={16}
                            className="mr-2 text-gray-500 dark:text-gray-400"
                          />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/settings");
                            setUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-white"
                        >
                          <Settings
                            size={16}
                            className="mr-2 text-gray-500 dark:text-gray-400"
                          />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <LogOut size={16} className="mr-2" />
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Headers;