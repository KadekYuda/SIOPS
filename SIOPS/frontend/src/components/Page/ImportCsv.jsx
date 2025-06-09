import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Moon,
  Sun,
  Menu,
  User,
  UserCircle,
  LogOut,
  Settings,
  Bell,
  Search,
  Plus,
  Calendar,
  Filter,
  Download,
  ChevronDown,
  Globe,
  HelpCircle
} from "lucide-react";

const ModernHeader = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  
  const userData = {
    name: "Sarah Johnson",
    role: "Store Manager",
    avatar: "SJ",
    email: "sarah@simsop.com"
  };

  const notifications = [
    { id: 1, title: "New order received", message: "Order #1234 needs attention", time: "2 min ago", unread: true },
    { id: 2, title: "Low stock alert", message: "Product ABC running low", time: "15 min ago", unread: true },
    { id: 3, title: "Daily report ready", message: "Your daily sales report is available", time: "1 hour ago", unread: false },
    { id: 4, title: "Payment confirmed", message: "Payment for order #1230 confirmed", time: "2 hours ago", unread: false },
  ];

  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setUserDropdown(!userDropdown);
    setNotificationDropdown(false);
  };
  const toggleNotificationDropdown = (e) => {
    e.stopPropagation();
    setNotificationDropdown(!notificationDropdown);
    setUserDropdown(false);
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
     
        
        {/* Header */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 dark:bg-gray-900/95 dark:border-gray-700/60 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Left Section */}
              <div className="flex items-center space-x-6">
                {/* Logo */}
                <div className="flex items-center space-x-3 group">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200">
                      SIMSOP
                    </h1>
                  </div>
                </div>
              </div>

              {/* Center Section - Search */}
              <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm transition-opacity duration-300 ${searchFocused ? 'opacity-100' : 'opacity-0'}`}></div>
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${searchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search products, orders, customers..."
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      {searchValue && (
                        <button
                          onClick={() => setSearchValue('')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          ×
                        </button>
                      )}
                      <Filter className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Mobile Search */}
                <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                  <Search className="w-5 h-5" />
                </button>

                {/* Language Selector */}
                <div className="relative hidden sm:block">
                  <button className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">EN</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Help */}
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                  <HelpCircle className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={toggleNotificationDropdown}
                    className={`relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 ${notificationDropdown ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  </button>

                  {notificationDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[100] overflow-hidden">
                      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                            {notifications.filter(n => n.unread).length} new
                          </span>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors duration-200 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 ${notification.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-gray-50/80 dark:bg-gray-800/80">
                        <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                          View all notifications
                        </button>
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
                    <Sun className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${darkMode ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                    <Moon className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                  </div>
                </button>

                {/* Mobile Menu */}
                <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
                  <Menu className="w-5 h-5" />
                </button>

                {/* User Profile */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleUserDropdown}
                    className={`flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 ${userDropdown ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">{userData.avatar}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{userData.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{userData.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {userDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[100] overflow-hidden">
                      {/* Profile Header */}
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-xl font-bold">{userData.avatar}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white dark:border-gray-900 rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{userData.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{userData.role}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{userData.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl flex items-center text-gray-700 dark:text-gray-300 transition-all duration-200 group">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                            <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span>View Profile</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl flex items-center text-gray-700 dark:text-gray-300 transition-all duration-200 group">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-200">
                            <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span>Account Settings</span>
                        </button>
                        
                        <hr className="my-3 border-gray-200/50 dark:border-gray-700/50" />
                        
                        <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center transition-all duration-200 group">
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

       
    </div>
  );
};

export default ModernHeader;