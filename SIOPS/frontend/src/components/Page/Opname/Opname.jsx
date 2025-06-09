import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Package,
  Calendar,
  ClipboardEdit,
  FileText,
  Search,
  X,
  Check,
  Eye,
  Plus,
  Filter,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Archive,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Mock API service
const api = {
  get: async (url) => {
    // Mock data for demonstration
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === "/users") {
      return {
        data: [
          { user_id: 1, username: "john_doe", name: "John Doe", role: "staff" },
          { user_id: 2, username: "jane_smith", name: "Jane Smith", role: "staff" },
          { user_id: 3, username: "mike_wilson", name: "Mike Wilson", role: "staff" }
        ]
      };
    }
    
    if (url === "/batch/stock") {
      return {
        data: {
          result: [
            {
              batch_id: 1,
              batch_code: "B001",
              stock_quantity: 150,
              product: {
                code_product: "P001",
                name_product: "Paracetamol 500mg",
                code_categories: "cat1"
              }
            },
            {
              batch_id: 2,
              batch_code: "B002",
              stock_quantity: 75,
              product: {
                code_product: "P002",
                name_product: "Vitamin C 1000mg",
                code_categories: "cat2"
              }
            },
            {
              batch_id: 3,
              batch_code: "B003",
              stock_quantity: 200,
              product: {
                code_product: "P003",
                name_product: "Fish Oil Supplement",
                code_categories: "cat3"
              }
            }
          ]
        }
      };
    }
    
    if (url === "/categories") {
      return {
        data: [
          { code_categories: "cat1", name_categories: "Obat" },
          { code_categories: "cat2", name_categories: "Vitamin" },
          { code_categories: "cat3", name_categories: "Suplemen" }
        ]
      };
    }
    
    if (url === "/opname") {
      return {
        data: [
          {
            opname_id: 1,
            user_id: 1,
            scheduled_date: "2024-12-01",
            status: "submitted",
            system_stock: 150,
            physical_stock: 148,
            difference: -2,
            User: { username: "john_doe" },
            batchStock: {
              product: { name_product: "Paracetamol 500mg" }
            }
          },
          {
            opname_id: 2,
            user_id: 2,
            scheduled_date: "2024-12-02",
            status: "reviewed",
            system_stock: 75,
            physical_stock: 75,
            difference: 0,
            User: { username: "jane_smith" },
            batchStock: {
              product: { name_product: "Vitamin C 1000mg" }
            }
          }
        ]
      };
    }
    
    return { data: [] };
  },
  
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { success: true } };
  }
};

// Mock Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md">
          {currentPage + 1}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Mock Modal Components
const AlertModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Error</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Success</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock Select Component
const Select = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  isMulti, 
  isClearable, 
  isSearchable, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (option) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.some(v => v.value === option.value);
      
      if (isSelected) {
        onChange(currentValues.filter(v => v.value !== option.value));
      } else {
        onChange([...currentValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };
  
  const displayValue = () => {
    if (isMulti && Array.isArray(value)) {
      return value.length > 0 ? `${value.length} selected` : placeholder;
    }
    return value ? value.label : placeholder;
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white flex items-center justify-between"
      >
        <span className="truncate">{displayValue()}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isSearchable && (
            <div className="p-2 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          )}
          
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{option.label}</span>
              {isMulti && Array.isArray(value) && value.some(v => v.value === option.value) && (
                <Check size={16} className="text-indigo-600" />
              )}
            </button>
          ))}
          
          {isClearable && value && (
            <button
              onClick={() => onChange(isMulti ? [] : null)}
              className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 border-t"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color = "indigo" }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-${color}-100 rounded-lg`}>
        <Icon className={`text-${color}-600`} size={24} />
      </div>
    </div>
  </div>
);

const Tab = ({ label, icon: Icon, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? "bg-white text-indigo-700 shadow-lg border-2 border-indigo-100"
        : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-2 border-transparent"
    }`}
  >
    {Icon && <Icon size={18} />}
    <span className="truncate">{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        isActive ? "bg-indigo-100 text-indigo-700" : "bg-indigo-200 text-indigo-700"
      }`}>
        {count}
      </span>
    )}
  </button>
);

const OpnameAdmin = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [opnames, setOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await api.get("/users");
      const staffUsers = Array.isArray(usersRes.data)
        ? usersRes.data
            .filter((user) => user.role === "staff" && user.username)
            .map((user) => ({
              ...user,
              username: user.username || user.name || `User ${user.user_id}`,
            }))
        : [];
      setUsers(staffUsers);

      const batchesRes = await api.get("/batch/stock");
      setBatches(batchesRes.data?.result || []);

      const opnamesRes = await api.get("/opname");
      setOpnames(Array.isArray(opnamesRes.data) ? opnamesRes.data : []);

      let categoriesData = [];
      try {
        const categoriesRes = await api.get("/categories");
        categoriesData = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.result || [];
      } catch (catErr) {
        try {
          const altCategoriesRes = await api.get("/products/categories");
          categoriesData = Array.isArray(altCategoriesRes.data)
            ? altCategoriesRes.data
            : altCategoriesRes.data?.result || [];
        } catch (altErr) {
          categoriesData = [
            { code_categories: "cat1", name_categories: "Obat" },
            { code_categories: "cat2", name_categories: "Vitamin" },
            { code_categories: "cat3", name_categories: "Suplemen" },
          ];
        }
      }
      setCategories(categoriesData);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  // Calculate stats
  const stats = {
    totalOpnames: opnames.length,
    scheduledOpnames: opnames.filter(op => op.status === 'scheduled').length,
    submittedOpnames: opnames.filter(op => op.status === 'submitted').length,
    completedOpnames: opnames.filter(op => op.status === 'reviewed' || op.status === 'adjusted').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading opname data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="px-4 py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full transform -translate-x-8 translate-y-8"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Package className="text-white" size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Opname Management</h1>
                    <p className="text-indigo-100 text-lg">
                      Comprehensive inventory tracking and management system
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Tab
                    label="Schedule Opname"
                    icon={Calendar}
                    isActive={activeTab === "schedule"}
                    onClick={() => setActiveTab("schedule")}
                    count={stats.scheduledOpnames}
                  />
                  <Tab
                    label="Direct Input"
                    icon={ClipboardEdit}
                    isActive={activeTab === "direct"}
                    onClick={() => setActiveTab("direct")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={BarChart3}
            title="Total Opnames"
            value={stats.totalOpnames}
            subtitle="All time records"
            color="indigo"
          />
          <StatsCard
            icon={Clock}
            title="Scheduled"
            value={stats.scheduledOpnames}
            subtitle="Pending execution"
            color="amber"
          />
          <StatsCard
            icon={AlertCircle}
            title="Submitted"
            value={stats.submittedOpnames}
            subtitle="Awaiting review"
            color="orange"
          />
          <StatsCard
            icon={CheckCircle}
            title="Completed"
            value={stats.completedOpnames}
            subtitle="Reviewed & adjusted"
            color="green"
          />
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === "schedule" && (
            <ScheduleOpname
              users={users}
              batches={batches}
              categories={categories}
              fetchData={fetchData}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
          {activeTab === "direct" && (
            <DirectOpname
              batches={batches}
              categories={categories}
              fetchData={fetchData}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
        </div>

        {/* Opname List Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Opname Records</h2>
                  <p className="text-indigo-100">
                    Monitor and manage all opname transactions
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-4 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{opnames.length}</div>
                  <div className="text-sm">Total Records</div>
                </div>
              </div>
            </div>
          </div>
          
          <AllOpname
            opnames={opnames}
            users={users}
            fetchData={fetchData}
            setError={setError}
            setSuccess={setSuccess}
          />
        </div>

        {/* Modals */}
        <AlertModal isOpen={!!error} message={error} onClose={clearError} />
        <SuccessModal
          isOpen={!!success}
          message={success}
          onClose={clearSuccess}
        />
      </div>
    </div>
  );
};

const AllOpname = ({ opnames, users, fetchData, setError, setSuccess }) => {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [reviewModal, setReviewModal] = useState({ open: false, opname: null });
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const userOptions = [
    { value: "", label: "All Users" },
    ...users.map((user) => ({
      value: user.user_id,
      label: user.username,
    })),
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "scheduled", label: "Scheduled" },
    { value: "submitted", label: "Submitted" },
    { value: "reviewed", label: "Reviewed" },
    { value: "adjusted", label: "Adjusted" },
  ];

  const filteredOpnames = opnames.filter(
    (opname) =>
      (opname.User?.username?.toLowerCase().includes(search.toLowerCase()) ||
        opname.batchStock?.product?.name_product
          ?.toLowerCase()
          .includes(search.toLowerCase())) &&
      (!filterDate || opname.scheduled_date === filterDate) &&
      (!filterStatus || opname.status === filterStatus) &&
      (!filterUser || opname.user_id === filterUser)
  );

  const getCurrentPageItems = () => {
    const sortedOpnamesAsc = [...filteredOpnames].sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.opname_id - b.opname_id;
    });
    const opnamesWithNumber = sortedOpnamesAsc.map((item, idx) => ({
      ...item,
      running_number: idx + 1,
    }));
    const sortedDisplay = [...opnamesWithNumber].sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      return b.opname_id - a.opname_id;
    });
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedDisplay.slice(start, end);
  };

  const handleReview = async (action) => {
    try {
      if (!reviewModal.opname) throw new Error("Select opname to review");
      const status = action === "adjust" ? "adjusted" : "reviewed";
      await api.post("/opname/review", {
        opname_id: reviewModal.opname.opname_id,
        adjustment_notes: adjustmentNotes.trim(),
        status,
        adjust_stock: action === "adjust",
      });
      setSuccess(
        action === "adjust"
          ? "Opname successfully adjusted!"
          : "Opname reviewed without adjustment!"
      );
      setReviewModal({ open: false, opname: null });
      setAdjustmentNotes("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to review opname");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
      submitted: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
      reviewed: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Eye },
      adjusted: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle }
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${config.color}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Enhanced Filters */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Filter & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by staff or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white shadow-sm"
            />
          </div>
          
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white shadow-sm"
            />
          </div>
          
          <div>
            <Select
              value={statusOptions.find(option => option.value === filterStatus)}
              onChange={(option) => setFilterStatus(option?.value || "")}
              options={statusOptions}
              placeholder="Filter Status..."
              className="text-sm"
              isClearable
            />
          </div>
          
          <div>
            <Select
              value={userOptions.find(option => option.value === filterUser)}
              onChange={(option) => setFilterUser(option?.value || "")}
              options={userOptions}
              placeholder="Filter User..."
              className="text-sm"
              isClearable
            />
          </div>
        </div>
      </div>

      {filteredOpnames.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No opname records found</h3>
          <p className="text-gray-500">Try adjusting your filters or create a new opname record</p>
        </div>
      ) : (
        <>
          {/* Enhanced Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    System Stock
                  </th>
                 <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Physical Stock
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getCurrentPageItems().map((opname) => (
                  <tr key={opname.opname_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {opname.running_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users size={14} className="text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {opname.User?.username || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {opname.batchStock?.product?.name_product || "Unknown Product"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(opname.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(opname.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {opname.system_stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {opname.physical_stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        (opname.difference || 0) > 0 
                          ? "text-green-600" 
                          : (opname.difference || 0) < 0 
                            ? "text-red-600" 
                            : "text-gray-600"
                      }`}>
                        {opname.difference > 0 ? "+" : ""}{opname.difference || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {opname.status === "submitted" && (
                          <button
                            onClick={() => setReviewModal({ open: true, opname })}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                          >
                            <Eye size={12} />
                            Review
                          </button>
                        )}
                        <span className="text-xs text-gray-500">
                          ID: {opname.opname_id}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Enhanced Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {getCurrentPageItems().map((opname) => (
              <div key={opname.opname_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">#{opname.running_number}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {opname.User?.username || "Unknown"}
                    </span>
                  </div>
                  {getStatusBadge(opname.status)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Product: </span>
                    <span className="text-gray-900">
                      {opname.batchStock?.product?.name_product || "Unknown Product"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Date: </span>
                    <span className="text-gray-900">
                      {new Date(opname.scheduled_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">System</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {opname.system_stock || 0}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Physical</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {opname.physical_stock || 0}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Difference</div>
                    <div className={`text-sm font-semibold ${
                      (opname.difference || 0) > 0 
                        ? "text-green-600" 
                        : (opname.difference || 0) < 0 
                          ? "text-red-600" 
                          : "text-gray-600"
                    }`}>
                      {opname.difference > 0 ? "+" : ""}{opname.difference || 0}
                    </div>
                  </div>
                </div>
                
                {opname.status === "submitted" && (
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">ID: {opname.opname_id}</span>
                    <button
                      onClick={() => setReviewModal({ open: true, opname })}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Eye size={12} />
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredOpnames.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOpnames.length}
          />
        </>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Review Opname</h3>
              <button
                onClick={() => setReviewModal({ open: false, opname: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {reviewModal.opname && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Opname Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Staff</label>
                      <p className="text-gray-900">{reviewModal.opname.User?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Product</label>
                      <p className="text-gray-900">
                        {reviewModal.opname.batchStock?.product?.name_product}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <p className="text-gray-900">
                        {new Date(reviewModal.opname.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p>{getStatusBadge(reviewModal.opname.status)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-blue-600 font-semibold text-lg">
                      {reviewModal.opname.system_stock}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">System Stock</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-green-600 font-semibold text-lg">
                      {reviewModal.opname.physical_stock}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Physical Count</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${
                    reviewModal.opname.difference > 0 ? "bg-green-50" :
                    reviewModal.opname.difference < 0 ? "bg-red-50" : "bg-gray-50"
                  }`}>
                    <div className={`font-semibold text-lg ${
                      reviewModal.opname.difference > 0 ? "text-green-600" :
                      reviewModal.opname.difference < 0 ? "text-red-600" : "text-gray-600"
                    }`}>
                      {reviewModal.opname.difference > 0 ? "+" : ""}{reviewModal.opname.difference}
                    </div>
                    <div className={`text-sm font-medium ${
                      reviewModal.opname.difference > 0 ? "text-green-700" :
                      reviewModal.opname.difference < 0 ? "text-red-700" : "text-gray-700"
                    }`}>
                      Difference
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjustment Notes
                  </label>
                  <textarea
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    placeholder="Add notes about this opname review..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReview("review")}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Check size={18} />
                    Accept Without Adjustment
                  </button>
                  <button
                    onClick={() => handleReview("adjust")}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle size={18} />
                    Accept & Adjust Stock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Schedule Opname Component
const ScheduleOpname = ({ users, batches, categories, fetchData, setSuccess, setError }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.username,
  }));

  const batchOptions = batches.map((batch) => ({
    value: batch.batch_id,
    label: `${batch.product?.name_product} (${batch.batch_code})`,
  }));

  const categoryOptions = categories.map((cat) => ({
    value: cat.code_categories,
    label: cat.name_categories,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError("Please select a scheduled date");
      return;
    }
    if (selectedUsers.length === 0) {
      setError("Please select at least one staff member");
      return;
    }
    if (selectedBatches.length === 0 && selectedCategories.length === 0) {
      setError("Please select products or categories to count");
      return;
    }

    setLoading(true);
    try {
      await api.post("/opname/schedule", {
        user_ids: selectedUsers.map(user => user.value),
        batch_ids: selectedBatches.map(batch => batch.value),
        category_codes: selectedCategories.map(cat => cat.value),
        scheduled_date: scheduledDate,
      });
      
      setSuccess("Opname scheduled successfully!");
      setSelectedUsers([]);
      setSelectedBatches([]);
      setSelectedCategories([]);
      setScheduledDate("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to schedule opname");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Calendar className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Schedule Opname</h2>
            <p className="text-indigo-100">
              Plan inventory counts for staff members
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Staff Members *
            </label>
            <Select
              value={selectedUsers}
              onChange={setSelectedUsers}
              options={userOptions}
              placeholder="Choose staff members..."
              isMulti
              isSearchable
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Products (Optional)
          </label>
          <Select
            value={selectedBatches}
            onChange={setSelectedBatches}
            options={batchOptions}
            placeholder="Choose specific products..."
            isMulti
            isSearchable
            isClearable
          />
          <p className="mt-2 text-xs text-gray-500">
            Leave empty to include all products, or select specific items
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Categories (Optional)
          </label>
          <Select
            value={selectedCategories}
            onChange={setSelectedCategories}
            options={categoryOptions}
            placeholder="Choose product categories..."
            isMulti
            isSearchable
            isClearable
          />
          <p className="mt-2 text-xs text-gray-500">
            Select categories to include all products within those categories
          </p>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Calendar size={18} />
                Schedule Opname
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Direct Opname Component
const DirectOpname = ({ batches, categories, fetchData, setSuccess, setError }) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const batchOptions = batches.map((batch) => ({
    value: batch.batch_id,
    label: `${batch.product?.name_product} (${batch.batch_code}) - Stock: ${batch.stock_quantity}`,
    batch: batch,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) {
      setError("Please select a product batch");
      return;
    }
    if (!physicalStock || physicalStock < 0) {
      setError("Please enter a valid physical stock count");
      return;
    }

    setLoading(true);
    try {
      await api.post("/opname/direct", {
        batch_id: selectedBatch.value,
        physical_stock: parseInt(physicalStock),
        notes: notes.trim(),
      });
      
      setSuccess("Direct opname recorded successfully!");
      setSelectedBatch(null);
      setPhysicalStock("");
      setNotes("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record direct opname");
    } finally {
      setLoading(false);
    }
  };

  const systemStock = selectedBatch?.batch?.stock_quantity || 0;
  const difference = physicalStock ? parseInt(physicalStock) - systemStock : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <ClipboardEdit className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Direct Opname Input</h2>
            <p className="text-green-100">
              Record inventory count immediately
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Product *
          </label>
          <Select
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={batchOptions}
            placeholder="Choose product to count..."
            isSearchable
            isClearable
          />
        </div>

        {selectedBatch && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{systemStock}</div>
                <div className="text-sm text-gray-600">System Stock</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {physicalStock || 0}
                </div>
                <div className="text-sm text-gray-600">Physical Count</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className={`text-2xl font-bold ${
                  difference > 0 ? "text-green-600" :
                  difference < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {difference > 0 ? "+" : ""}{difference}
                </div>
                <div className="text-sm text-gray-600">Difference</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Physical Stock Count *
            </label>
            <input
              type="number"
              value={physicalStock}
              onChange={(e) => setPhysicalStock(e.target.value)}
              placeholder="Enter actual count..."
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any observations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !selectedBatch || !physicalStock}
            className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Recording...
              </>
            ) : (
              <>
                <Check size={18} />
                Record Opname
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OpnameAdmin;