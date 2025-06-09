import React, { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
import {
  Moon,
  Sun,
  Menu,
  UserCircle,
  LogOut,
  Settings,
  Bell,
  Globe,
  ChevronDown,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../service/api";
import LoadingComponent from "../../LoadingComponent";

// Komponen UserAvatarWithStatus
const UserAvatarWithStatus = ({ name = "User", status = "online" }) => {
  const words = name.split(" ");
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : `${words[0].charAt(0)}${words[words.length - 1].charAt(
          0
        )}`.toUpperCase();

  const statusColor = status === "online" ? "bg-green-500" : "bg-gray-400";

  return (
    <div className="relative">
      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
        <span className="text-white text-sm font-bold">{initials}</span>
      </div>
      <div
        className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white dark:border-gray-900 rounded-full`}
      ></div>
    </div>
  );
};

// Komponen Headers yang Diperbarui
const Headers = ({
  darkMode,
  toggleDarkMode,
  toggleSidebar,
  toggleDesktopSidebar,
}) => {
  const [menuActive, setMenuActive] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Data notifikasi (contoh)
  const notifications = [
    {
      id: 1,
      title: "New order received",
      message: "Order #1234 needs attention",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Low stock alert",
      message: "Product ABC running low",
      time: "15 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "Daily report ready",
      message: "Your daily sales report is available",
      time: "1 hour ago",
      unread: false,
    },
  ];

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      setUserData(response.data.user);
      setLoading(false);
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
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout", null);
      setUserData(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setUserDropdown((prev) => !prev);
    setNotificationDropdown(false);
  };

  const toggleNotificationDropdown = (e) => {
    e.stopPropagation();
    setNotificationDropdown((prev) => !prev);
    setUserDropdown(false);
  };

  return (
    <nav
      className={clsx(
        "fixed top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/60 dark:bg-gray-900/95 dark:border-gray-700/60 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20"
      )}
    >
      <div className="px-2 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center justify-start rtl:justify-end space-x-2">
            {/* Mobile Menu Button */}
            <button
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <a href="/#" className="flex items-center space-x-2 ml-2 my-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200">
                SIMSOP
              </h1>
            </a>

            {/* Desktop Menu Button */}
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

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <button className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">EN</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={toggleNotificationDropdown}
                className={`relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 ${
                  notificationDropdown ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                  {notifications.filter((n) => n.unread).length}
                </span>
              </button>

              {notificationDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[100] overflow-hidden">
                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                        {notifications.filter((n) => n.unread).length} new
                      </span>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors duration-200 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 ${
                          notification.unread
                            ? "bg-blue-50/30 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.unread
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300"
            >
              <div className="relative w-5 h-5">
                <Sun
                  className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                    darkMode ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                  }`}
                />
                <Moon
                  className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                    darkMode ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                  }`}
                />
              </div>
            </button>

            {/* User Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className={`flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 ${
                  userDropdown ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
              >
                <UserAvatarWithStatus
                  name={userData?.name || "User"}
                  status="online"
                />

                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userData?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userData?.role || "Role"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    userDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[100] overflow-hidden">
                  {/* Profile Header */}
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    {userData ? (
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl font-bold">
                              {userData.name.split(" ").length === 1
                                ? userData.name.slice(0, 2).toUpperCase()
                                : `${userData.name
                                    .split(" ")[0]
                                    .charAt(0)}${userData.name
                                    .split(" ")
                                    .pop()
                                    .charAt(0)}`.toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white dark:border-gray-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {loading ? <LoadingComponent /> : userData.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {userData.role}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {userData.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <LoadingComponent />
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate("/userprofile");
                        setUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl flex items-center text-gray-700 dark:text-gray-300 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                        <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl flex items-center text-gray-700 dark:text-gray-300 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-200">
                        <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span>Account Settings</span>
                    </button>
                    <hr className="my-3 border-gray-200/50 dark:border-gray-700/50" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors duration-200">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
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
