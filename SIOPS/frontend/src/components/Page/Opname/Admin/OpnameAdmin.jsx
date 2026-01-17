import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Calendar,
  ClipboardEdit,
  FileText,
  Search,
  X,
  Check,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Select from "react-select";
import api from "../../../../service/api";
import Pagination from "../../Product/Pagination";
import AlertModal from "../../../modal/AlertModal";
import SuccessModal from "../../../modal/SuccessModal";
import BatchStatus from "../../BatchStatus";
import BatchExpDate from "../../BatchExpDate";

const Tab = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium ${
      isActive
        ? "bg-white text-indigo-700 shadow-sm"
        : "bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400"
    }`}
  >
    {Icon && <Icon size={18} />}
    <span className="truncate">{label}</span>
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
  const [opnamesLoaded, setOpnamesLoaded] = useState(false);

  // Cache duration in milliseconds (5 minutes untuk data statis, 2 menit untuk data dinamis)
  const CACHE_DURATION = {
    static: 5 * 60 * 1000, // 5 menit untuk users, categories
    dynamic: 2 * 60 * 1000, // 2 menit untuk batches, opnames
  };

  // Session storage keys
  const CACHE_KEYS = useMemo(
    () => ({
      users: "opname_users_cache",
      categories: "opname_categories_cache",
      batches: "opname_batches_cache",
      opnames: "opname_opnames_cache",
      timestamp: "opname_cache_timestamp",
    }),
    []
  );

  // Helper functions untuk session storage caching
  const getCachedData = useCallback((key) => {
    try {
      const cached = sessionStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Error reading cache:", error);
      return null;
    }
  }, []);

  const setCachedData = useCallback((key, data) => {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn("Error setting cache:", error);
    }
  }, []);

  const isCacheValid = useCallback(
    (cacheKey, duration) => {
      const cached = getCachedData(cacheKey);
      if (!cached) return false;
      return Date.now() - cached.timestamp < duration;
    },
    [getCachedData]
  );

  // Fetch initial data (users, batches, categories) dengan caching
  const fetchInitialData = useCallback(
    async (force = false) => {
      // Check session storage cache first
      if (!force) {
        const usersCache = getCachedData(CACHE_KEYS.users);
        const categoriesCache = getCachedData(CACHE_KEYS.categories);
        const batchesCache = getCachedData(CACHE_KEYS.batches);

        const usersValid = isCacheValid(
          CACHE_KEYS.users,
          CACHE_DURATION.static
        );
        const categoriesValid = isCacheValid(
          CACHE_KEYS.categories,
          CACHE_DURATION.static
        );
        const batchesValid = isCacheValid(
          CACHE_KEYS.batches,
          CACHE_DURATION.dynamic
        );

        // Jika semua data cached dan valid, gunakan cache
        if (usersValid && categoriesValid && batchesValid) {
          setUsers(usersCache.data);
          setCategories(categoriesCache.data);
          setBatches(batchesCache.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch essential data first (exclude opnames for faster initial load)
        const [usersRes, batchesRes, categoriesRes] = await Promise.allSettled([
          api.get("/users"),
          api.get("/batch/stock"),
          api
            .get("/categories")
            .catch(() => api.get("/products/categories"))
            .catch(() => null),
        ]);

        console.log("Users API response:", usersRes); // Debug log

        // Process users (optimized)
        const staffUsers =
          usersRes.status === "fulfilled" && Array.isArray(usersRes.value.data)
            ? usersRes.value.data.reduce((acc, user) => {
                // Only include active staff users
                if (user.role === "staff" && user.status === "active") {
                  acc.push({
                    ...user,
                    username:
                      user.name || user.username || `Staff ${user.user_id}`,
                    user_id: user.user_id,
                  });
                }
                return acc;
              }, [])
            : [];

        console.log("Fetched staff users:", staffUsers); // Debug log
        setUsers(staffUsers);
        setCachedData(CACHE_KEYS.users, staffUsers);

        // Process batches (optimized)
        const batchData =
          batchesRes.status === "fulfilled"
            ? batchesRes.value.data?.result || []
            : [];
        const validBatches = batchData.filter(
          (batch) =>
            batch?.product?.code_product && batch?.product?.name_product
        );
        setBatches(validBatches);
        setCachedData(CACHE_KEYS.batches, validBatches);

        // Process categories (simplified fallback)
        let categoriesData = [];
        if (categoriesRes.status === "fulfilled" && categoriesRes.value) {
          categoriesData = Array.isArray(categoriesRes.value.data)
            ? categoriesRes.value.data
            : categoriesRes.value.data?.result || [];
        } else {
          // Fallback data
          categoriesData = [
            { code_categories: "cat1", name_categories: "Obat" },
            { code_categories: "cat2", name_categories: "Vitamin" },
            { code_categories: "cat3", name_categories: "Suplemen" },
          ];
        }
        setCategories(categoriesData);
        setCachedData(CACHE_KEYS.categories, categoriesData);
      } catch (err) {
        setError(err.response?.data?.error || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    },
    [
      CACHE_DURATION.static,
      CACHE_DURATION.dynamic,
      CACHE_KEYS.users,
      CACHE_KEYS.categories,
      CACHE_KEYS.batches,
      isCacheValid,
      getCachedData,
      setCachedData,
    ]
  );

  // Fetch opnames data separately and lazily dengan caching
  const fetchOpnamesData = useCallback(
    async (force = false) => {
      // Check cache first untuk opnames
      if (!force) {
        const opnamesCache = getCachedData(CACHE_KEYS.opnames);
        const opnamesValid = isCacheValid(
          CACHE_KEYS.opnames,
          CACHE_DURATION.dynamic
        );

        if (opnamesValid && opnamesCache?.data) {
          setOpnames(opnamesCache.data);
          setOpnamesLoaded(true);
          return;
        }
      }

      if (!force && opnamesLoaded) return;

      try {
        const opnamesRes = await api.get("/opname/all");

        // Create lookup maps for better performance
        const userMap = new Map(users.map((user) => [user.user_id, user]));
        const batchMap = new Map(
          batches.map((batch) => [batch.batch_id, batch])
        );

        // Process opnames (optimized with maps)
        const transformedOpnames = Array.isArray(opnamesRes.data)
          ? opnamesRes.data.map((opname) => ({
              ...opname,
              User: userMap.get(opname.user_id) || {
                username: `Staff ${opname.user_id}`,
              },
              batchStock: {
                ...batchMap.get(opname.batch_id),
                product: batchMap.get(opname.batch_id)?.product || {
                  name_product: `Batch ${opname.batch_id}`,
                },
              },
            }))
          : [];
        setOpnames(transformedOpnames);
        setCachedData(CACHE_KEYS.opnames, transformedOpnames);
        setOpnamesLoaded(true);
      } catch (err) {
        setError(err.response?.data?.error || "Gagal memuat data opname");
      }
    },
    [
      users,
      batches,
      opnamesLoaded,
      CACHE_DURATION.dynamic,
      CACHE_KEYS.opnames,
      getCachedData,
      isCacheValid,
      setCachedData,
    ]
  );

  // Combined fetch function that calls both initial data and opnames
  const fetchData = useCallback(
    async (force = false) => {
      await fetchInitialData(force);
      // Load opnames after initial data is loaded
      if (users.length > 0 && batches.length > 0) {
        await fetchOpnamesData(force);
      }
    },
    [fetchInitialData, fetchOpnamesData, users.length, batches.length]
  );

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load opnames data when users and batches are available
  useEffect(() => {
    if (users.length > 0 && batches.length > 0 && !opnamesLoaded) {
      fetchOpnamesData();
    }
  }, [users.length, batches.length, opnamesLoaded, fetchOpnamesData]);

  // Function untuk clear cache ketika ada perubahan data
  const clearOpnameCache = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEYS.opnames);
    sessionStorage.removeItem(CACHE_KEYS.batches);
  }, [CACHE_KEYS]);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <div className="px-4">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-t-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center">
              <Package className="text-white mr-3" size={36} />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Opname Management
                </h1>
                <p className="text-indigo-100 text-sm">Loading data...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium bg-white text-indigo-700 shadow-sm">
                  <Calendar size={18} />
                  <span className="truncate">Schedule Opname</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400">
                  <ClipboardEdit size={18} />
                  <span className="truncate">Direct Opname</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-b-xl shadow-md border border-gray-100 border-t-0">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 sm:px-6 py-4 sm:py-6 border-b rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-white mr-2 sm:mr-3" size={30} />
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Opname List
                    </h2>
                    <p className="text-sm text-gray-200">
                      Loading opname transactions...
                    </p>
                  </div>
                </div>
                <div className="animate-pulse">
                  <div className="h-10 w-32 bg-indigo-600 rounded-lg"></div>
                </div>
              </div>
            </div>
            <div className="p-6 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="px-4">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-t-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center">
            <Package className="text-white mr-3" size={36} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Opname Management
              </h1>
              <p className="text-indigo-100 text-sm">
                Manage assignments and direct opname input
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Tab
                label="Schedule Opname"
                icon={Calendar}
                isActive={activeTab === "schedule"}
                onClick={() => setActiveTab("schedule")}
              />
              <Tab
                label="Direct Opname"
                icon={ClipboardEdit}
                isActive={activeTab === "direct"}
                onClick={() => setActiveTab("direct")}
              />
            </div>
          </div>
        </div>
        <div className="mb-8">
          {activeTab === "schedule" && (
            <ScheduleOpname
              users={users}
              batches={batches}
              categories={categories}
              fetchData={() => {
                // Clear cache sebelum fetch ulang
                clearOpnameCache();
                fetchData(true);
              }}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
          {activeTab === "direct" && (
            <DirectOpname
              batches={batches}
              categories={categories}
              fetchData={() => {
                // Clear cache sebelum fetch ulang
                clearOpnameCache();
                fetchData(true);
              }}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
        </div>
        <div className="bg-white rounded-b-xl shadow-md border border-gray-100 border-t-0">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 sm:px-6 py-4 sm:py-6 border-b rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-white mr-2 sm:mr-3" size={30} />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Opname List
                  </h2>
                  <p className="text-sm text-gray-200">
                    View and manage your opname transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Clear cache untuk refresh paksa
                  clearOpnameCache();
                  fetchData(true);
                }}
                className="text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Data
              </button>
            </div>
          </div>
          <AllOpname
            opnames={opnames}
            users={users}
            batches={batches}
            categories={categories}
            fetchData={() => {
              // Clear cache setelah ada perubahan
              clearOpnameCache();
              fetchData(true);
            }}
            setError={setError}
            setSuccess={setSuccess}
          />
        </div>
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

const AllOpname = ({
  opnames,
  users,
  batches,
  categories,
  fetchData,
  setError,
  setSuccess,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const itemsPerPage = 10;
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  // Pagination per group
  const [groupPagination, setGroupPagination] = useState({});

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.username,
  }));

  // Helper function to format categories for display
  const formatCategoriesForDisplay = (categories) => {
    if (!categories || categories.length === 0) return "";

    if (categories.length <= 2) {
      return categories.join(", ");
    } else {
      return `${categories.slice(0, 2).join(", ")}...`;
    }
  };

  const groupedOpnames = opnames.reduce((acc, opname) => {
    const date = opname.scheduled_date || opname.opname_date; // Gunakan opname_date untuk direct opname
    const key = `${date}-${opname.user_id || "admin"}`; // Gunakan "admin" untuk direct opname
    if (!acc[key]) {
      acc[key] = {
        date: date,
        user_id: opname.user_id,
        items: [],
        status: opname.status,
        user: users.find((u) => u.user_id === opname.user_id) || {
          username: "Admin",
        },
        categories: new Set(), // Track unique categories
      };
    }
    acc[key].items.push(opname);

    // Add category to the set if it exists
    const categoryCode = opname.batch_stock?.product?.code_categories;
    if (categoryCode) {
      acc[key].categories.add(categoryCode);
    }

    if (opname.status === "adjusted") acc[key].status = "adjusted";
    else if (opname.status === "submitted" && acc[key].status !== "adjusted")
      acc[key].status = "submitted";
    return acc;
  }, {});

  // Convert categories Set to array and get category names
  Object.values(groupedOpnames).forEach((group) => {
    const categoryNames = Array.from(group.categories)
      .map((code) => {
        // Try to find category name from categories data or batches
        const category = categories.find((cat) => cat.code_categories === code);
        if (category) {
          return category.name_categories;
        }

        // Fallback: get from batches if categories not available
        const batch = batches.find(
          (batch) => batch.product?.code_categories === code
        );
        return batch?.product?.Categories?.name_categories || code;
      })
      .filter(Boolean);
    group.categoryNames = categoryNames;
  });

  const opnameList = Object.values(groupedOpnames);

  const filteredOpnames = opnameList.filter((opnameGroup) => {
    // Search in username or product names
    const searchMatch =
      search === "" ||
      opnameGroup.user?.username
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      opnameGroup.items?.some(
        (item) =>
          item.batch_stock?.product?.name_product
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          item.batch_stock?.product?.code_product
            ?.toLowerCase()
            .includes(search.toLowerCase())
      );

    const dateMatch = !filterDate || opnameGroup.date === filterDate;
    const statusMatch = !filterStatus || opnameGroup.status === filterStatus;
    const userMatch = !filterUser || opnameGroup.user_id === filterUser;

    return searchMatch && dateMatch && statusMatch && userMatch;
  });

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Pagination functions per group
  const getGroupCurrentPage = (groupId) => {
    return groupPagination[groupId]?.currentPage || 1;
  };

  const setGroupCurrentPage = (groupId, page) => {
    setGroupPagination((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], currentPage: page },
    }));
  };

  const getGroupItems = (group, groupKey) => {
    if (!group || !group.items) return [];
    const currentPage = getGroupCurrentPage(groupKey);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return group.items.slice(startIndex, endIndex);
  };

  const getGroupTotalPages = (group) => {
    if (!group || !group.items) return 1;
    return Math.ceil(group.items.length / itemsPerPage);
  };

  const handleReview = async (action, items) => {
    try {
      if (!items?.length) throw new Error("No items to review");

      // Filter hanya item yang statusnya submitted untuk adjust
      const submittedItems = items.filter(
        (item) => item.status === "submitted"
      );

      if (action === "adjust" && submittedItems.length === 0) {
        throw new Error("No submitted items to adjust");
      }

      const itemsToProcess = action === "adjust" ? submittedItems : items;

      // Check if any items have pending edit requests
      const hasEditRequests = itemsToProcess.some(
        (item) =>
          item.edit_requested ||
          (item.notes && item.notes.includes("[REQUEST EDIT]"))
      );

      if (action === "adjust" && hasEditRequests) {
        throw new Error(
          "Cannot adjust items with pending edit requests. Please approve or reject the edit requests first."
        );
      }
      const status = action === "adjust" ? "adjusted" : "reviewed";

      await Promise.all(
        itemsToProcess.map((item) =>
          api.post("/opname/review", {
            opname_id: item.opname_id,
            status,
            adjust_stock: action === "adjust",
          })
        )
      );

      setSuccess(
        action === "adjust"
          ? `${itemsToProcess.length} opnames adjusted!`
          : "Opnames reviewed!"
      );
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "failed adjust opname: waiting for admin to approve or reject edit request."
      );
    }
  };

  const handleEditRequestDecision = async (opnameId, approve) => {
    try {
      await api.post("/opname/review", {
        opname_id: opnameId,
        approve_edit: approve,
        status: approve ? "scheduled" : "submitted", // If approved, back to scheduled for editing; if rejected, keep as submitted
      });

      setSuccess(
        approve
          ? "Edit request approved! Staff can now edit the opname."
          : "Edit request rejected."
      );
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process edit request");
    }
  };

  return (
    <div className="p-3 sm:p-4">
      {/* Search and filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by staff name, product name, or product code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <Select
            value={[
              { value: "scheduled", label: "Scheduled" },
              { value: "submitted", label: "Submitted" },
              { value: "adjusted", label: "Adjusted" },
            ].find((option) => option.value === filterStatus)}
            onChange={(option) => setFilterStatus(option?.value || "")}
            options={[
              { value: "scheduled", label: "Scheduled" },
              { value: "submitted", label: "Submitted" },
              { value: "adjusted", label: "Adjusted" },
            ]}
            placeholder="Filter Status..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
        <div>
          <Select
            value={userOptions.find((option) => option.value === filterUser)}
            onChange={(option) => setFilterUser(option?.value || "")}
            options={userOptions}
            placeholder="Filter User..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
      </div>

      {filteredOpnames.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">
            No opname found
          </h3>
          <p className="text-gray-400 text-sm">
            There are no recorded opnames yet
          </p>
        </div>
      ) : (
        <>
          {/* Expandable List */}
          <div className="space-y-4">
            {filteredOpnames.map((opnameGroup, index) => {
              const groupKey = `${opnameGroup.date}-${opnameGroup.user_id}`;
              const isExpanded = expandedGroups.has(groupKey);

              return (
                <div
                  key={groupKey}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isExpanded
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          Schedule: {opnameGroup.user?.username || "Admin"},{" "}
                          {opnameGroup.date}
                          {opnameGroup.categoryNames &&
                            opnameGroup.categoryNames.length > 0 && (
                              <span className="text-gray-600 font-normal">
                                {" "}
                                -{" "}
                                {formatCategoriesForDisplay(
                                  opnameGroup.categoryNames
                                )}
                              </span>
                            )}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {opnameGroup.items?.length || 0} items
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              opnameGroup.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800"
                                : opnameGroup.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {opnameGroup.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="grid gap-3">
                        {getGroupItems(opnameGroup, groupKey).map(
                          (item, itemIndex) => {
                            // Calculate difference for color coding
                            const systemStock =
                              parseInt(item.system_stock) || 0;
                            const physicalStock =
                              parseInt(item.physical_stock) || 0;
                            const difference = physicalStock - systemStock;

                            return (
                              <div
                                key={item.opname_id}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {item.batch_stock?.product
                                          ?.name_product || "N/A"}
                                      </span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        Code:{" "}
                                        {item.batch_stock?.product
                                          ?.code_product || "N/A"}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                                      <div>
                                        <span className="font-medium">
                                          Difference:
                                        </span>
                                        {/* Hanya tampilkan difference jika status submitted/adjusted dan physical stock ada */}
                                        {item.status === "scheduled" ||
                                        item.physical_stock === null ||
                                        item.physical_stock === undefined ? (
                                          <span className="ml-1 font-semibold text-gray-500">
                                            -
                                          </span>
                                        ) : (
                                          <span
                                            className={`ml-1 font-semibold ${
                                              difference > 0
                                                ? "text-blue-600"
                                                : difference < 0
                                                ? "text-red-600"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {difference > 0
                                              ? `+${difference}`
                                              : difference}
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          System:
                                        </span>{" "}
                                        {systemStock}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Physical:
                                        </span>{" "}
                                        {physicalStock}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Status:
                                        </span>
                                        <span
                                          className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                                            item.status === "scheduled"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : item.status === "submitted"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                      </div>
                                    </div>
                                    {item.notes && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <span className="font-medium">
                                          Notes:
                                        </span>{" "}
                                        <span
                                          className={
                                            item.edit_requested ||
                                            (item.notes &&
                                              item.notes.includes(
                                                "[REQUEST EDIT]"
                                              ))
                                              ? "text-orange-600 font-medium"
                                              : ""
                                          }
                                        >
                                          {item.notes}
                                        </span>
                                        {(item.edit_requested ||
                                          (item.notes &&
                                            item.notes.includes(
                                              "[REQUEST EDIT]"
                                            ))) && (
                                          <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            Edit Requested
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex space-x-2 ml-4">
                                    {/* Show Approve/Reject buttons for edit requests */}
                                    {(item.edit_requested ||
                                      (item.notes &&
                                        item.notes.includes(
                                          "[REQUEST EDIT]"
                                        ))) && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRequestDecision(
                                              item.opname_id,
                                              true
                                            );
                                          }}
                                          className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 flex items-center"
                                        >
                                          <Check size={12} className="mr-1" />
                                          Approve Edit
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditRequestDecision(
                                              item.opname_id,
                                              false
                                            );
                                          }}
                                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex items-center"
                                        >
                                          <X size={12} className="mr-1" />
                                          Reject Edit
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/opname-detail/${item.opname_id}`
                                        );
                                      }}
                                      className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center"
                                    >
                                      <Eye size={12} className="mr-1" />
                                      View
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Pagination untuk grup ini */}
                      {opnameGroup.items &&
                        opnameGroup.items.length > itemsPerPage && (
                          <div className="flex justify-center mt-4 pt-4 border-t border-gray-200">
                            <Pagination
                              currentPage={getGroupCurrentPage(groupKey) - 1} // Pagination component uses 0-based indexing
                              totalPages={getGroupTotalPages(opnameGroup)}
                              onPageChange={(page) =>
                                setGroupCurrentPage(groupKey, page + 1)
                              } // Convert back to 1-based
                              itemsPerPage={itemsPerPage}
                              totalItems={opnameGroup.items.length}
                            />
                          </div>
                        )}

                      {/* Action Buttons for Group */}
                      <div className="mt-4 flex space-x-2 justify-end">
                        {opnameGroup.items.some(
                          (item) => item.status === "submitted"
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview("adjust", opnameGroup.items);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center"
                          >
                            <Check size={14} className="mr-1" />
                            Approve & Adjust Stock
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const ScheduleOpname = ({
  users,
  batches,
  categories,
  fetchData,
  setSuccess,
  setError,
}) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [batchSummary, setBatchSummary] = useState({
    count: 0,
    categories: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [productList, setProductList] = useState([]);
  const [allowPastDateScheduling, setAllowPastDateScheduling] = useState(false);

  const userOptions = users.map((user) => ({
    value: String(user.user_id),
    label: user.username,
  }));

  const categoryOptions = categories.map((category) => ({
    value: category.code_categories,
    label: category.name_categories || `Category ${category.code_categories}`,
  }));

  // Load admin setting for past date scheduling
  useEffect(() => {
    const savedSetting = localStorage.getItem("allowPastDateScheduling");
    setAllowPastDateScheduling(savedSetting === "true");
  }, []);

  useEffect(() => {
    if (!Array.isArray(batches) || batches.length === 0) {
      setProductList([]);
      setBatchSummary({ count: 0, categories: [] });
      return;
    }

    const productsFromBatches = batches
      .filter(
        (batch) =>
          batch && // Check if batch exists
          batch.product && // Check if product exists
          (selectedCategories.length === 0 ||
            selectedCategories.includes(batch.product.code_categories)) &&
          (!searchProduct ||
            batch.product.name_product
              ?.toLowerCase()
              .includes(searchProduct.toLowerCase()) ||
            batch.product.code_product
              ?.toLowerCase()
              .includes(searchProduct.toLowerCase()))
      )
      .map((batch) => ({
        ...batch.product,
        batchCount: 1,
        totalStock: batch.stock_quantity || 0,
      }))
      .reduce((unique, item) => {
        if (!unique[item.code_product]) {
          unique[item.code_product] = item;
        }
        return unique;
      }, {});

    const filteredProducts = Object.values(productsFromBatches);
    setProductList(filteredProducts);

    const categoryCounts = filteredProducts.reduce((acc, product) => {
      const category = categories.find(
        (cat) => cat.code_categories === product.code_categories
      );
      const categoryName = category?.name_categories || "Unknown Category";
      if (!acc[categoryName])
        acc[categoryName] = { name: categoryName, count: 0 };
      acc[categoryName].count += 1;
      return acc;
    }, {});

    setBatchSummary({
      count: filteredProducts.length,
      categories: Object.values(categoryCounts),
    });
  }, [selectedCategories, batches, categories, searchProduct]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!scheduledDate) throw new Error("Please select a schedule date");

      // Validasi: tidak boleh schedule di masa lalu (kecuali admin mengaktifkan opsi)
      if (!allowPastDateScheduling) {
        const today = new Date();
        const selectedDate = new Date(scheduledDate);
        today.setHours(0, 0, 0, 0); // Reset time untuk comparison yang akurat
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          throw new Error(
            "Schedule date cannot be in the past. Please select today or a future date."
          );
        }
      }

      if (selectedCategories.length === 0)
        throw new Error("Please select at least one product category");

      if (!selectedUserId) throw new Error("- Select staff for assignment");

      // Validasi: cek apakah ada kategori yang sudah di-assign tapi belum selesai
      console.log("Checking category conflict for:", {
        categories: selectedCategories,
        scheduled_date: scheduledDate,
        assigned_user_id: selectedUserId,
      });

      try {
        const conflictResponse = await api.post(
          "/opname/check-category-conflict",
          {
            categories: selectedCategories,
            scheduled_date: scheduledDate,
            assigned_user_id: selectedUserId,
          }
        );

        console.log("Conflict check response:", conflictResponse.data);

        if (conflictResponse.data.hasConflict) {
          const conflictDetails = conflictResponse.data.conflicts
            .map(
              (conflict) =>
                `${conflict.category_name} (${conflict.users.join(", ")}, ${
                  conflict.pending_count
                } pending items)`
            )
            .join(", ");

          const errorMessage = `Cannot assign categories that are already scheduled but not completed: ${conflictDetails}. Please wait until all items in these categories are marked as 'adjusted' or choose different categories.`;
          console.log("Throwing conflict error:", errorMessage);
          throw new Error(errorMessage);
        }
      } catch (err) {
        console.error("Category conflict check error:", err);
        // Always throw the error to prevent schedule creation
        if (err.response?.status === 409) {
          throw new Error(err.response.data.error);
        }
        if (err.message && err.message.includes("Cannot assign categories")) {
          throw err; // Re-throw our custom error
        }
        if (err.response?.data?.error) {
          throw new Error(err.response.data.error);
        }
        // If there's any error in conflict check, throw it to be safe
        throw new Error(
          "Category conflict validation failed. Please try again."
        );
      }

      const products = batches
        .filter(
          (batch) =>
            batch && // Check if batch exists
            batch.product && // Check if product exists
            selectedCategories.includes(batch.product.code_categories)
        )
        .map((batch) => batch.product.code_product)
        .filter((value, index, self) => self.indexOf(value) === index);

      for (const code_product of products) {
        await api.post("/opname/create", {
          code_product,
          scheduled_date: scheduledDate,
          assigned_user_id: selectedUserId,
        });
      }

      setSuccess(
        `Opname assignment for ${products.length} products has been successfully created!`
      );
      setSelectedCategories([]);
      setSelectedUserId("");
      setScheduledDate("");
      fetchData();
    } catch (err) {
      console.error("Error in handleCreateTask:", err);
      setError(
        err.message ||
          err.response?.data?.error ||
          "Unable to create opname assignment"
      );
    }
  };

  const filteredCategories = batchSummary.categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  return (
    <div className="bg-white rounded-none shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <Calendar className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Schedule Opname
          </h2>
          <p className="text-sm text-gray-500">
            Create a new opname assignment
          </p>
        </div>
      </div>
      <form onSubmit={handleCreateTask} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Categories
            </label>
            <Select
              isMulti
              value={categoryOptions.filter((option) =>
                selectedCategories.includes(option.value)
              )}
              onChange={(options) =>
                setSelectedCategories(
                  options ? options.map((opt) => opt.value) : []
                )
              }
              options={categoryOptions}
              placeholder="Select Categories..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  "&:hover": { borderColor: "#9ca3af" },
                  boxShadow: "none",
                  "&:focus": {
                    borderColor: "#4f46e5",
                    boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                  },
                }),
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Staff (Required)
            </label>
            <Select
              value={userOptions.find(
                (option) => option.value === selectedUserId
              )}
              onChange={(option) => setSelectedUserId(option?.value || "")}
              options={userOptions}
              placeholder="Select Staff..."
              className="text-sm"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  "&:hover": { borderColor: "#9ca3af" },
                  boxShadow: "none",
                  "&:focus": {
                    borderColor: "#4f46e5",
                    boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                  },
                }),
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={
                  allowPastDateScheduling
                    ? undefined
                    : new Date().toISOString().split("T")[0]
                } // Conditional min based on admin setting
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Admin Setting Alert */}
        {allowPastDateScheduling && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Past Date Scheduling Enabled
                </h3>
                <div className="mt-1 text-sm text-amber-700">
                  <p>
                    You can now schedule opname tasks for past dates. This
                    setting can be changed in your User Profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <h4 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-1">
            <Package className="text-indigo-500" size={16} />
            Batch Summary
          </h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <div>
              <strong>Total Products:</strong> {batchSummary.count}
            </div>
            <div className="text-xs text-indigo-600 bg-indigo-100 p-2 rounded">
              <strong>Note:</strong> All products in selected categories will be
              displayed, but only active products will be assigned to staff.
              Inactive products will be automatically skipped.
            </div>
            {batchSummary.categories.length > 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
              >
                <span>View Category Details</span>
                <Eye size={16} />
              </button>
            )}
          </div>
        </div>
        {productList.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                Product List ({productList.length}):
              </h4>
              <div className="relative w-1/3">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by code or product..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productList.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {product.code_product || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {product.name_product || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {categories.find(
                          (cat) =>
                            cat.code_categories === product.code_categories
                        )?.name_categories || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.status || "unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center text-sm"
          >
            <Check className="mr-2" size={14} />
            Confirm Assignment
          </button>
        </div>
      </form>

      {/* Modal for Category Details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Category Details
              </h3>
              <div className="relative mt-2">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search category..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="p-6 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Batch Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((cat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {cat.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {cat.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCategories.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No categories found.
                </p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ScheduleOpname.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      username: PropTypes.string.isRequired,
      name: PropTypes.string,
    })
  ).isRequired,
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      stock_quantity: PropTypes.number,
      product: PropTypes.shape({
        code_product: PropTypes.string.isRequired,
        name_product: PropTypes.string.isRequired,
        code_categories: PropTypes.string,
      }),
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ).isRequired,
  fetchData: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

ScheduleOpname.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      username: PropTypes.string.isRequired,
      name: PropTypes.string,
    })
  ).isRequired,
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      stock_quantity: PropTypes.number,
      product: PropTypes.shape({
        code_product: PropTypes.string.isRequired,
        name_product: PropTypes.string.isRequired,
        code_categories: PropTypes.string,
      }),
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ).isRequired,
  fetchData: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

const DirectOpname = ({
  batches,
  categories,
  fetchData,
  setSuccess,
  setError,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredQuantity, setExpiredQuantity] = useState("");
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [showUpdateExpModal, setShowUpdateExpModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [newExpDate, setNewExpDate] = useState("");
  const [pendingInputs, setPendingInputs] = useState([]); // State untuk tabel sementara

  // Check if product already exists in pending inputs when opening modal
  useEffect(() => {
    if (showBatchModal && selectedProduct) {
      const existingInput = pendingInputs.find(
        (input) => input.code_product === selectedProduct
      );

      if (existingInput) {
        // Fill form with existing data
        setPhysicalStock(existingInput.physical_stock.toString());
        setExpiredQuantity(existingInput.expired_stock.toString());
        setDamagedQuantity(existingInput.damaged_stock.toString());
        setNotes(existingInput.notes || "");
      } else {
        // Clear form for new input
        setPhysicalStock("");
        setExpiredQuantity("");
        setDamagedQuantity("");
        setNotes("");
      }
    }
  }, [showBatchModal, selectedProduct, pendingInputs]);

  const handleUpdateExpDate = (batch) => {
    setSelectedBatch(batch);
    // Use expired_date or exp_date, whichever is available
    const currentExpDate = batch.expired_date || batch.exp_date;
    setNewExpDate(currentExpDate ? currentExpDate.split("T")[0] : "");
    setShowUpdateExpModal(true);
  };

  const saveExpDate = async () => {
    try {
      if (!newExpDate) {
        setError("Please select an expiration date");
        return;
      }

      await api.put(`/batch/${selectedBatch.batch_id}`, {
        expired_date: newExpDate,
      });
      setSuccess("Expiration date updated successfully");
      fetchData();
      setShowUpdateExpModal(false);
      setSelectedBatch(null);
      setNewExpDate("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.msg ||
        "Failed to update expiration date";
      setError(errorMessage);
      console.error("Error updating expiration date:", err);
    }
  };

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((category) => ({
      value: category.code_categories,
      label: category.name_categories,
    })),
  ];

  const productOptions = useMemo(() => {
    return batches
      .filter(
        (batch) =>
          batch && // Check if batch exists
          batch.product && // Check if product exists
          (!selectedCategory ||
            batch.product.code_categories === selectedCategory) &&
          (!batchSearch ||
            batch.product.name_product
              ?.toLowerCase()
              .includes(batchSearch.toLowerCase()) ||
            batch.product.code_product
              ?.toLowerCase()
              .includes(batchSearch.toLowerCase()))
      )
      .map((batch) => ({
        value: batch.product.code_product,
        label: `${batch.product.name_product}${
          batch.product.status === "inactive" ? " (Inactive)" : ""
        }`,
        status: batch.product.status,
      }))
      .filter(
        (value, index, self) =>
          self.findIndex((v) => v.value === value.value) === index
      );
  }, [batches, selectedCategory, batchSearch]);

  const handleSaveInput = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!selectedProduct) throw new Error("Pilih produk terlebih dahulu");
      if (!physicalStock || parseInt(physicalStock) < 0)
        throw new Error("Masukkan stok fisik yang valid");

      const currentDate = new Date().toISOString().split("T")[0];
      const newInput = {
        code_product: selectedProduct,
        physical_stock: parseInt(physicalStock),
        expired_stock: parseInt(expiredQuantity) || 0,
        damaged_stock: parseInt(damagedQuantity) || 0,
        notes,
        date: currentDate,
      };

      // Check if product already exists in pending inputs
      const existingIndex = pendingInputs.findIndex(
        (input) => input.code_product === selectedProduct
      );

      if (existingIndex !== -1) {
        // Update existing input
        const updatedInputs = [...pendingInputs];
        updatedInputs[existingIndex] = newInput;
        setPendingInputs(updatedInputs);
        setSuccess("Opname input updated successfully!");
      } else {
        // Add new input
        setPendingInputs([...pendingInputs, newInput]);
        setSuccess("Opname input saved pending!");
      }

      setShowBatchModal(false);
      setSelectedProduct(null);
      setSelectedCategory("");
      setPhysicalStock("");
      setExpiredQuantity("");
      setDamagedQuantity("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan input opname");
    }
  };

  const handleConfirmOpname = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (pendingInputs.length === 0)
        throw new Error("No pending inputs to confirm");

      // Send the pendingInputs array to the backend
      await api.post("/opname/confirm", { pendingInputs });

      setPendingInputs([]);
      setSuccess("Direct opname confirmed!");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengkonfirmasi opname");
    }
  };

  return (
    <div className="bg-white rounded-none shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <ClipboardEdit className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Direct Opname</h2>
          <p className="text-sm text-gray-500">
            Input opname data directly. Inactive products will show error on
            save.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Category
          </label>
          <Select
            value={categoryOptions.find(
              (option) => option.value === selectedCategory
            )}
            onChange={(option) => {
              setSelectedCategory(option?.value || "");
              setSelectedProduct(null);
              setBatchSearch("");
            }}
            options={categoryOptions}
            placeholder="Select Category..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Product
          </label>
          <Select
            value={productOptions.find(
              (option) => option.value === selectedProduct
            )}
            onChange={(option) => {
              if (option) {
                // Check if selected product is inactive
                const selectedProductOption = productOptions.find(
                  (p) => p.value === option.value
                );
                if (
                  selectedProductOption &&
                  selectedProductOption.status === "inactive"
                ) {
                  setError(
                    `Cannot select inactive product "${selectedProductOption.label.replace(
                      " (Inactive)",
                      ""
                    )}". Please select an active product.`
                  );
                  setSelectedProduct(null);
                  return;
                }
                setSelectedProduct(option.value);
              } else {
                setSelectedProduct(null);
              }
            }}
            options={productOptions}
            placeholder="Select Product..."
            className="text-sm"
            isClearable
            isDisabled={batchSearch !== ""}
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
      </div>
      {selectedProduct && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          <div className="bg-white px-4 py-3 border-b">
            <h3 className="font-medium text-gray-800">Product Details</h3>
          </div>
          <div className="divide-y">
            {batches
              .filter(
                (batch) =>
                  batch &&
                  batch.product &&
                  batch.product.code_product === selectedProduct
              )
              .map((batch) => (
                <div key={batch.batch_id} className="bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">
                        Batch: {batch.batch_code}
                      </p>
                      <div className="flex space-x-3">
                        <BatchStatus
                          stockQuantity={batch.stock_quantity}
                          expDate={batch.expired_date}
                          batchId={batch.batch_id}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateExpDate(batch)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200 w-full sm:w-auto"
                    >
                      <Calendar size={14} className="mr-1" />
                      <span className="sm:inline">Update Exp. Date</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="bg-indigo-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-indigo-600 font-medium">
                  Total Batches:
                </span>
                <span className="ml-2 text-indigo-900">
                  {
                    batches.filter(
                      (b) => b.product.code_product === selectedProduct
                    ).length
                  }
                </span>
              </div>
              <div>
                <span className="text-indigo-600 font-medium">
                  Total Stock:
                </span>
                <span className="ml-2 text-indigo-900">
                  {batches
                    .filter((b) => b.product.code_product === selectedProduct)
                    .reduce((sum, b) => sum + b.stock_quantity, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => {
          if (selectedProduct) setShowBatchModal(true);
          else setError("Please select a product first");
        }}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
      >
        Input Opname
      </button>
      {pendingInputs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Pending Inputs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Physical Stock</th>
                  <th className="px-4 py-2">Expired Stock</th>
                  <th className="px-4 py-2">Damaged Stock</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInputs.map((input, index) => {
                  const productName = batches.find(
                    (b) => b.product.code_product === input.code_product
                  )?.product.name_product;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {productName || input.code_product}
                      </td>
                      <td className="px-4 py-2">{input.physical_stock}</td>
                      <td className="px-4 py-2">{input.expired_stock}</td>
                      <td className="px-4 py-2">{input.damaged_stock}</td>
                      <td className="px-4 py-2">{input.date}</td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(input.code_product);
                              // Set category for the product
                              const product = batches.find(
                                (b) =>
                                  b.product.code_product === input.code_product
                              )?.product;
                              if (product) {
                                setSelectedCategory(
                                  product.code_categories || ""
                                );
                              }
                              setShowBatchModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit"
                          >
                            <ClipboardEdit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setPendingInputs(
                                pendingInputs.filter((_, i) => i !== index)
                              )
                            }
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirmOpname}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            Confirm Direct Opname
          </button>
        </div>
      )}
      {showBatchModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingInputs.find(
                    (input) => input.code_product === selectedProduct
                  )
                    ? "Update"
                    : "Input"}{" "}
                  Opname:{" "}
                  {
                    batches.find(
                      (b) => b.product.code_product === selectedProduct
                    )?.product.name_product
                  }
                </h3>
                {pendingInputs.find(
                  (input) => input.code_product === selectedProduct
                ) && (
                  <p className="text-sm text-blue-600 mt-1">
                    Updating existing opname record
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveInput} className="p-6">
              <div className="mb-6 bg-indigo-50 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-3">
                  Current Stock Information
                </h4>
                <div className="space-y-3">
                  {batches
                    .filter(
                      (batch) =>
                        batch &&
                        batch.product &&
                        batch.product.code_product === selectedProduct
                    )
                    .map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="bg-white rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              Batch {batch.batch_code}
                            </p>
                            <div className="mt-1">
                              <BatchStatus
                                stockQuantity={batch.stock_quantity}
                                expDate={batch.expired_date}
                                batchId={batch.batch_id}
                              />
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-500">System Stock</p>
                            <p className="font-medium">
                              {batch.stock_quantity} units
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="bg-indigo-100 rounded-lg p-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-indigo-900">
                        Total System Stock:
                      </span>
                      <span className="text-sm font-bold text-indigo-900">
                        {batches
                          .filter(
                            (b) => b.product.code_product === selectedProduct
                          )
                          .reduce((sum, b) => sum + b.stock_quantity, 0)}{" "}
                        units
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Physical Stock Count*
                  </label>
                  <input
                    type="number"
                    value={physicalStock}
                    onChange={(e) => setPhysicalStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    required
                    min="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expired Stock
                    </label>
                    <input
                      type="number"
                      value={expiredQuantity}
                      onChange={(e) => setExpiredQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Damaged Stock
                    </label>
                    <input
                      type="number"
                      value={damagedQuantity}
                      onChange={(e) => setDamagedQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    rows="3"
                    placeholder="Add any additional notes about the stock count..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                >
                  {pendingInputs.find(
                    (input) => input.code_product === selectedProduct
                  )
                    ? "Update Input"
                    : "Save Input"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}{" "}
      {/* Update Expiration Date Modal */}
      {showUpdateExpModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Expiration Date
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  Batch: {selectedBatch.batch_code}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Expiration Date
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
                  <BatchExpDate
                    expDate={
                      selectedBatch.expired_date || selectedBatch.exp_date
                    }
                    batchId={selectedBatch.batch_id}
                    showOnlyDate={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Expiration Date *
                </label>
                <input
                  type="date"
                  value={newExpDate}
                  onChange={(e) => setNewExpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateExpModal(false);
                    setSelectedBatch(null);
                    setNewExpDate("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveExpDate}
                  disabled={!newExpDate}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DirectOpname.propTypes = {
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      batch_code: PropTypes.string.isRequired,
      stock_quantity: PropTypes.number,
      product: PropTypes.shape({
        code_product: PropTypes.string.isRequired,
        name_product: PropTypes.string.isRequired,
        code_categories: PropTypes.string,
      }),
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ).isRequired,
  fetchData: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

export default OpnameAdmin;
