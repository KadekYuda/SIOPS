import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../../service/api";
import BatchStatus from "../../BatchStatus";
import AlertModal from "../../../modal/AlertModal";
import SuccessModal from "../../../modal/SuccessModal";
import Pagination from "../../Product/Pagination";

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "scheduled":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Scheduled",
        };
      case "submitted":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Submitted",
        };
      case "adjusted":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Adjusted",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const ProductOpname = ({ setError, setSuccess, fetchData }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredStock, setExpiredStock] = useState("");
  const [damagedStock, setDamagedStock] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  // Pagination per group
  const [groupPagination, setGroupPagination] = useState({});
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  // State for overdue confirmation modal
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [pendingOpnameData, setPendingOpnameData] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Tambahkan parameter untuk mengambil semua status
      const response = await api.get("/opname/tasks", {
        params: {
          include_all_status: true,
        },
      });
      if (!Array.isArray(response.data)) {
        throw new Error("Format response tidak valid dari server");
      }

      const dateGroups = {};
      const pagination = {};

      response.data.forEach((task) => {
        const scheduleDate =
          task.scheduled_date || task.created_at.split("T")[0];
        const product = task.batch_stock.product;
        // Get category name for individual product tracking
        const categoryName =
          product.category?.name_categories ||
          product.code_categories ||
          "Uncategorized";

        if (!dateGroups[scheduleDate]) {
          dateGroups[scheduleDate] = [];
        }

        // Create single group per date (combine all categories)
        let combinedGroup = dateGroups[scheduleDate].find(
          (group) => group.category === "All Categories"
        );
        if (!combinedGroup) {
          combinedGroup = {
            id: `${scheduleDate}-all`,
            scheduleDate,
            category: "All Categories",
            products: [],
            categoryBreakdown: {}, // Track products per category for display
          };
          dateGroups[scheduleDate].push(combinedGroup);
          pagination[`${scheduleDate}-all`] = { currentPage: 1 };
        }

        // Add category to breakdown if not exists
        if (!combinedGroup.categoryBreakdown[categoryName]) {
          combinedGroup.categoryBreakdown[categoryName] = [];
        }

        const productData = {
          opname_id: task.opname_id,
          product_code: product.code_product,
          product_name: product.name_product,
          batch_code: task.batch_stock.batch_code,
          stock_quantity: task.batch_stock.stock_quantity || 0,
          expired_date: task.batch_stock.exp_date,
          status: task.status || "scheduled",
          created_at: task.created_at,
          notes: task.notes || "",
          // Detect edit request status from both flag and notes content
          edit_requested:
            task.edit_requested ||
            (task.notes && task.notes.includes("[REQUEST EDIT]")),
          physical_stock: task.physical_stock,
          expired_stock: task.expired_stock,
          damaged_stock: task.damaged_stock,
          categoryName: categoryName, // Store individual category
        };

        combinedGroup.products.push(productData);
        combinedGroup.categoryBreakdown[categoryName].push(productData);
      });

      Object.keys(dateGroups).forEach((date) => {
        dateGroups[date].forEach((group) => {
          group.products.sort((a, b) => {
            // Prioritas utama: urutan berdasarkan kategori (AIR dulu, lalu ALCOHOL)
            const categoryA = a.categoryName;
            const categoryB = b.categoryName;

            if (categoryA !== categoryB) {
              // Definisi urutan kategori
              const categoryOrder = {
                AIR: 1,
                ALCOHOL: 2,
                // Tambahkan kategori lain jika diperlukan, atau gunakan string comparison
              };

              const orderA = categoryOrder[categoryA] || 999;
              const orderB = categoryOrder[categoryB] || 999;

              if (orderA !== orderB) {
                return orderA - orderB;
              }

              // Jika tidak ada di categoryOrder, urutkan secara alphabetical
              return categoryA.localeCompare(categoryB);
            }

            // Prioritas kedua: urutan status dalam kategori yang sama
            const statusOrder = {
              scheduled: 1,
              submitted: 2,
              adjusted: 3,
            };

            // Ambil urutan status, default ke 999 jika status tidak dikenal
            const statusA = statusOrder[a.status] || 999;
            const statusB = statusOrder[b.status] || 999;

            // Urutkan berdasarkan status
            if (statusA !== statusB) {
              return statusA - statusB;
            }

            // Prioritas ketiga: jika kategori dan status sama, urutkan berdasarkan kode produk
            const codeA = parseInt(a.product_code) || 0;
            const codeB = parseInt(b.product_code) || 0;
            return codeA - codeB;
          });
        });
      });

      setTasks(dateGroups);
      setGroupPagination(pagination);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.response?.data?.error || "Gagal memuat tugas opname");
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const getGroupProducts = (group) => {
    const currentPage = getGroupCurrentPage(group.id);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return group.products.slice(startIndex, endIndex);
  };

  const getGroupTotalPages = (group) => {
    return Math.ceil(group.products.length / itemsPerPage);
  };

  // Function to get current active category based on pagination
  const getCurrentActiveCategory = (group) => {
    const currentPage = getGroupCurrentPage(group.id);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProducts = group.products.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    // Get the first product's category in the current page
    if (currentProducts.length > 0) {
      return currentProducts[0].categoryName;
    }

    return "All Categories";
  };

  // Function to get category summary for display
  const getCategorySummary = (group) => {
    const categories = Object.keys(group.categoryBreakdown || {});
    const totalProducts = group.products.length;

    return {
      categories: categories,
      totalCategories: categories.length,
      totalProducts: totalProducts,
      categoryBreakdown: group.categoryBreakdown,
    };
  };

  // Filtered groups with search and pagination
  const { filteredTasks, groupKeys, totalPages, currentGroups } =
    useMemo(() => {
      const filtered = {};
      Object.keys(tasks).forEach((date) => {
        const filteredTasks = tasks[date].filter(
          (categoryGroup) =>
            categoryGroup.category
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            categoryGroup.products.some(
              (product) =>
                product.product_name
                  .toLowerCase()
                  .includes(search.toLowerCase()) ||
                product.product_code
                  .toLowerCase()
                  .includes(search.toLowerCase())
            )
        );
        if (filteredTasks.length > 0) {
          filtered[date] = filteredTasks;
        }
      });

      const groupKeys = Object.keys(filtered).sort(
        (a, b) => new Date(b) - new Date(a)
      );
      const totalPages = Math.ceil(groupKeys.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const currentGroups = groupKeys.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      return {
        filteredTasks: filtered,
        groupKeys,
        totalPages,
        currentGroups,
      };
    }, [tasks, search, currentPage, itemsPerPage]);

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper function to check if schedule date is overdue
  const isScheduleOverdue = (scheduleDate) => {
    if (!scheduleDate) return false;
    const today = new Date();
    const scheduled = new Date(scheduleDate);
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    return scheduled < today;
  };

  // Helper function to get overdue days
  const getOverdueDays = (scheduleDate) => {
    if (!scheduleDate) return 0;
    const today = new Date();
    const scheduled = new Date(scheduleDate);
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    const diffTime = today - scheduled;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTotalProducts = (tasks) => {
    return tasks.reduce((total, task) => total + task.products.length, 0);
  };

  // Function to handle overdue confirmation
  const handleOverdueConfirmation = (product, task) => {
    const scheduleDate = task.scheduleDate;
    const overdueDays = getOverdueDays(scheduleDate);

    setPendingOpnameData({
      product,
      task,
      scheduleDate,
      overdueDays,
      confirmMessage: `This opname schedule is ${overdueDays} day(s) overdue (scheduled for ${formatDate(
        scheduleDate
      )}). Are you sure you want to proceed?`,
    });
    setShowOverdueModal(true);
  };

  const confirmOverdueOpname = () => {
    if (pendingOpnameData) {
      setSelectedProduct({
        ...pendingOpnameData.product,
        batches: pendingOpnameData.task.products.filter(
          (p) => p.product_code === pendingOpnameData.product.product_code
        ),
      });
    }
    setShowOverdueModal(false);
    setPendingOpnameData(null);
  };

  const cancelOverdueOpname = () => {
    setShowOverdueModal(false);
    setPendingOpnameData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const physical = parseInt(physicalStock);
      const expired = parseInt(expiredStock) || 0;
      const damaged = parseInt(damagedStock) || 0;

      if (isNaN(physical) || physical < 0) {
        throw new Error("Stok fisik harus berupa angka positif");
      }

      // Only validate that expired+damaged <= physical if physical is not zero
      // This allows for all-expired cases where physical=0 but expired+damaged>0
      if (expired + damaged > physical && physical > 0) {
        throw new Error(
          "Total stok kadaluarsa dan rusak tidak boleh melebihi stok fisik"
        );
      }

      let remainingPhysical = physical;
      let remainingExpired = expired;
      let remainingDamaged = damaged;

      const batchUpdates = selectedProduct.batches.map((batch) => {
        const batchUpdate = {
          opname_id: batch.opname_id,
          physical_stock: 0,
          expired_stock: 0,
          damaged_stock: 0,
          notes: notes.trim(),
          opname_date: new Date().toISOString().split("T")[0],
        };

        if (remainingExpired > 0) {
          const expiredForBatch = Math.min(
            remainingExpired,
            batch.stock_quantity
          );
          batchUpdate.expired_stock = expiredForBatch;
          remainingExpired -= expiredForBatch;
        }

        if (remainingDamaged > 0) {
          const damagedForBatch = Math.min(
            remainingDamaged,
            batch.stock_quantity - batchUpdate.expired_stock
          );
          batchUpdate.damaged_stock = damagedForBatch;
          remainingDamaged -= damagedForBatch;
        }

        if (remainingPhysical > 0) {
          // Don't limit physical stock to system stock (batch.stock_quantity)
          // Instead, distribute proportionally based on the total system stock
          let physicalForBatch;
          const totalSystemStock = selectedProduct.batches.reduce(
            (total, b) => total + b.stock_quantity,
            0
          );

          if (selectedProduct.batches.length === 1) {
            // If there's only one batch, assign all remaining physical stock to it
            physicalForBatch = remainingPhysical;
          } else {
            // For multiple batches, distribute proportionally
            const systemRatio = batch.stock_quantity / totalSystemStock;
            physicalForBatch = Math.min(
              remainingPhysical,
              Math.round(physical * systemRatio)
            );
          }

          batchUpdate.physical_stock = physicalForBatch;
          remainingPhysical -= physicalForBatch;
        }

        return api.post(`/opname/submit/${batch.opname_id}`, batchUpdate);
      });

      await Promise.all(batchUpdates);

      setSuccess("Stock opname submitted successfully!");
      setSelectedProduct(null);
      resetForm();
      fetchTasks();
      fetchData();
    } catch (err) {
      console.error("Error submitting opname:", err);
      setError(err.response?.data?.error || "Gagal mengirim opname");
    }
  };

  const resetForm = () => {
    setPhysicalStock("");
    setExpiredStock("");
    setDamagedStock("");
    setNotes("");
  };

  const getStockDifferenceData = (systemStock, physicalStock) => {
    const diff = physicalStock - systemStock;
    let diffText = diff.toString();
    let textColorClass = "";

    if (diff > 0) {
      diffText = `+${diff}`;
      textColorClass = "text-blue-600";
    } else if (diff < 0) {
      textColorClass = "text-red-600";
    }

    return {
      text: diffText,
      class: textColorClass,
    };
  };
  // Function untuk request edit
  const requestEdit = async (product) => {
    try {
      const response = await api.post(`/opname/request-edit`, {
        opname_id: product.opname_id,
        reason: "Staff requesting permission to edit submitted opname",
      });

      // Update the product status in the UI immediately
      if (response.data && response.data.status === "edit_requested") {
        // Mark this product as having an edit request
        product.edit_requested = true;

        // Force a re-render of the component by updating the tasks state
        setTasks((prevTasks) => {
          return { ...prevTasks };
        });
      }

      setSuccess("Edit request sent to admin for approval");
      // Fetch the latest data to reflect changes
      fetchTasks();
    } catch (err) {
      console.error("Error requesting edit:", err);
      if (err.response?.data?.status === "edit_requested") {
        setError("This item already has a pending edit request");
      } else {
        setError(err.response?.data?.error || "Failed to request edit");
      }
    }
  };

  // Function untuk render tombol aksi berdasarkan status
  const renderActionButton = (product, task) => {
    // Get schedule date for this product
    const scheduleDate = task.scheduleDate;
    const isOverdue = isScheduleOverdue(scheduleDate);

    const handleStartOpname = () => {
      if (isOverdue) {
        handleOverdueConfirmation(product, task);
      } else {
        setSelectedProduct({
          ...product,
          batches: task.products.filter(
            (p) => p.product_code === product.product_code
          ),
        });
      }
    };

    // Jika ada edit request yang pending, tampilkan status khusus
    if (
      product.edit_requested ||
      (product.notes && product.notes.includes("[REQUEST EDIT]"))
    ) {
      return (
        <div className="w-full bg-white border border-gray-200 text-gray-500 px-3 py-2 rounded text-sm font-medium text-center cursor-not-allowed">
          Edit Request Pending
        </div>
      );
    }

    switch (product.status) {
      case "scheduled":
        return (
          <button
            onClick={handleStartOpname}
            className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
              isOverdue
                ? "bg-orange-600 hover:bg-orange-700 text-white border border-orange-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isOverdue ? "Start Overdue Opname" : "Start Opname"}
          </button>
        );

      case "submitted":
        return (
          <button
            onClick={() => requestEdit(product)}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Request Edit
          </button>
        );

      case "adjusted":
        return (
          <button
            onClick={() => navigate(`/opname-detail/${product.opname_id}`)}
            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
          >
            <Eye size={14} className="mr-1.5" />
            View Details
          </button>
        );

      default:
        return (
          <button
            onClick={() => navigate(`/opname-detail/${product.opname_id}`)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            View Details
          </button>
        );
    }
  };

  // Function untuk render tombol aksi desktop
  const renderActionButtonDesktop = (product, task) => {
    // Get schedule date for this product
    const scheduleDate = task.scheduleDate;
    const isOverdue = isScheduleOverdue(scheduleDate);

    const handleStartOpname = () => {
      if (isOverdue) {
        handleOverdueConfirmation(product, task);
      } else {
        setSelectedProduct({
          ...product,
          batches: task.products.filter(
            (p) => p.product_code === product.product_code
          ),
        });
      }
    };

    // Jika ada edit request yang pending, tampilkan status khusus
    if (
      product.edit_requested ||
      (product.notes && product.notes.includes("[REQUEST EDIT]"))
    ) {
      return (
        <span className="bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
          Edit Request Pending
        </span>
      );
    }

    switch (product.status) {
      case "scheduled":
        return (
          <button
            onClick={handleStartOpname}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isOverdue
                ? "bg-orange-600 hover:bg-orange-700 text-white border border-orange-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isOverdue ? "Start Overdue Opname" : "Start Opname"}
          </button>
        );

      case "submitted":
        return (
          <button
            onClick={() => requestEdit(product)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Request Edit
          </button>
        );

      case "adjusted":
        return (
          <button
            onClick={() => navigate(`/opname-detail/${product.opname_id}`)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
          >
            <Eye size={14} className="mr-1.5" />
            View Details
          </button>
        );

      default:
        return (
          <button
            onClick={() => navigate(`/opname-detail/${product.opname_id}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </button>
        );
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-6 rounded-xl mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="text-white mr-3" size={24} />
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Staff Opname Management
                  </h1>
                  <p className="text-indigo-100 text-sm">
                    Manage your opname tasks and history
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {groupKeys.length} schedule groups
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-indigo-300" />
              <input
                type="text"
                placeholder="Search product name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-sm border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        ) : groupKeys.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">
              {search ? "Product not found" : "No opname tasks available"}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {currentGroups.map((dateKey) => (
              <div
                key={dateKey}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {formatDate(dateKey)}
                        </h3>
                        {isScheduleOverdue(dateKey) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {getOverdueDays(dateKey)} days overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {filteredTasks[dateKey].length} categories •{" "}
                        {getTotalProducts(filteredTasks[dateKey])} products
                        {isScheduleOverdue(dateKey) && (
                          <span className="text-red-500 ml-1">
                            • Schedule Overdue
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {filteredTasks[dateKey].map((task) => {
                    const currentPage = getGroupCurrentPage(task.id);
                    const totalPages = getGroupTotalPages(task);
                    const currentProducts = getGroupProducts(task);
                    const isExpanded = expandedGroups.has(task.id);

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                          onClick={() => toggleGroup(task.id)}
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
                                {getCurrentActiveCategory(task)}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {task.products.length} total items
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {getCategorySummary(task).totalCategories}{" "}
                                  categories
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Page {getGroupCurrentPage(task.id)}/
                                  {getGroupTotalPages(task)}
                                </span>
                                {/* Status distribution indicators */}
                                {(() => {
                                  const statusCounts = task.products.reduce(
                                    (acc, product) => {
                                      acc[product.status] =
                                        (acc[product.status] || 0) + 1;
                                      return acc;
                                    },
                                    {}
                                  );

                                  return (
                                    <div className="flex items-center space-x-1">
                                      {statusCounts.scheduled && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                          S:{statusCounts.scheduled}
                                        </span>
                                      )}
                                      {statusCounts.submitted && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                          B:{statusCounts.submitted}
                                        </span>
                                      )}
                                      {statusCounts.adjusted && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                          A:{statusCounts.adjusted}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                {totalPages > 1 && (
                                  <span className="text-xs text-gray-500">
                                    Page {currentPage}/{totalPages}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                isExpanded
                                  ? "bg-gradient-to-r from-green-400 to-blue-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-200 p-3 space-y-2">
                            {currentProducts.map((product, index) => (
                              <div
                                key={`${product.product_code}-${index}`}
                                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-gray-900 text-sm">
                                        {product.product_name}
                                      </h5>
                                      <StatusBadge status={product.status} />
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex justify-between items-center">
                                        <div className="flex space-x-2">
                                          <span>Code:</span>
                                          <span className="font-mono">
                                            {product.product_code}
                                          </span>
                                        </div>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                          {product.categoryName}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <p className="text-xs text-gray-500">
                                          Created:{" "}
                                          {formatDate(product.created_at)}
                                        </p>
                                      </div>
                                      <div className="flex justify-between">
                                        <BatchStatus
                                          stockQuantity={product.stock_quantity}
                                          expDate={product.expired_date}
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      {renderActionButton(product, task)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {getGroupTotalPages(task) > 1 && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs text-gray-600 text-center">
                                    {(getGroupCurrentPage(task.id) - 1) *
                                      itemsPerPage +
                                      1}
                                    -
                                    {Math.min(
                                      getGroupCurrentPage(task.id) *
                                        itemsPerPage,
                                      task.products.length
                                    )}{" "}
                                    of{" "}
                                    <span className="font-medium">
                                      {task.products.length}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() =>
                                        setGroupCurrentPage(
                                          task.id,
                                          getGroupCurrentPage(task.id) - 1
                                        )
                                      }
                                      disabled={
                                        getGroupCurrentPage(task.id) === 1
                                      }
                                      className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                                      title="Previous"
                                    >
                                      ‹
                                    </button>

                                    <div className="px-3 py-1 text-xs text-gray-700 bg-gray-50 rounded min-w-[60px] text-center">
                                      {getGroupCurrentPage(task.id)}/
                                      {getGroupTotalPages(task)}
                                    </div>

                                    <button
                                      onClick={() =>
                                        setGroupCurrentPage(
                                          task.id,
                                          getGroupCurrentPage(task.id) + 1
                                        )
                                      }
                                      disabled={
                                        getGroupCurrentPage(task.id) ===
                                        getGroupTotalPages(task)
                                      }
                                      className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                                      title="Next"
                                    >
                                      ›
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {groupKeys.length > itemsPerPage && (
          <div className="mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Schedule Groups
                </h3>
                <p className="text-xs text-gray-500">
                  Navigate through date groups
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-600 text-center">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, groupKeys.length)} of{" "}
                  <span className="font-medium">{groupKeys.length}</span> groups
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                    title="Previous"
                  >
                    ‹
                  </button>

                  <div className="px-3 py-1 text-xs text-gray-700 bg-gray-50 rounded min-w-[60px] text-center">
                    {currentPage}/{totalPages}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                    title="Next"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="text-white mr-4" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Staff Opname Management
                </h1>
                <p className="text-indigo-100">
                  Manage your opname tasks and history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <span className="text-white font-medium">
                  {groupKeys.length} schedule groups
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search product name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading tasks...</span>
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? "Product not found" : "No opname tasks available"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentGroups.map((dateKey) => (
                <div
                  key={dateKey}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Schedule: {formatDate(dateKey)}
                            </h3>
                            {isScheduleOverdue(dateKey) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {getOverdueDays(dateKey)} days overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {filteredTasks[dateKey].length} categories,{" "}
                            {getTotalProducts(filteredTasks[dateKey])} products
                            {isScheduleOverdue(dateKey) && (
                              <span className="text-red-500 ml-1">
                                • Schedule Overdue
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {filteredTasks[dateKey].map((task) => {
                      const currentPage = getGroupCurrentPage(task.id);
                      const totalPages = getGroupTotalPages(task);
                      const currentProducts = getGroupProducts(task);
                      const isExpanded = expandedGroups.has(task.id);

                      return (
                        <div
                          key={task.id}
                          className="border border-gray-200 rounded-lg"
                        >
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleGroup(task.id)}
                          >
                            <div className="flex items-center space-x-3">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {getCurrentActiveCategory(task)}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm text-gray-500">
                                    {task.products.length} total products
                                  </p>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {getCategorySummary(task).totalCategories}{" "}
                                    categories
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Page {getGroupCurrentPage(task.id)}/
                                    {getGroupTotalPages(task)}
                                  </span>
                                  {/* Status distribution indicators */}
                                  {(() => {
                                    const statusCounts = task.products.reduce(
                                      (acc, product) => {
                                        acc[product.status] =
                                          (acc[product.status] || 0) + 1;
                                        return acc;
                                      },
                                      {}
                                    );

                                    return (
                                      <div className="flex items-center space-x-1">
                                        {statusCounts.scheduled && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            Scheduled: {statusCounts.scheduled}
                                          </span>
                                        )}
                                        {statusCounts.submitted && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            Submitted: {statusCounts.submitted}
                                          </span>
                                        )}
                                        {statusCounts.adjusted && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Adjusted: {statusCounts.adjusted}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-500">
                              Page {currentPage} of {totalPages}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200">
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product Code
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product Name
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 bg-white">
                                    {currentProducts.map((product, index) => (
                                      <tr
                                        key={`${product.product_code}-${index}`}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {product.product_code}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          <div className="text-sm font-medium text-gray-900">
                                            {product.product_name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            <div className="flex items-center justify-between">
                                              <p className="text-xs text-gray-500">
                                                Created:{" "}
                                                {formatDate(product.created_at)}
                                              </p>
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                {product.categoryName}
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          <BatchStatus
                                            stockQuantity={
                                              product.stock_quantity
                                            }
                                            expDate={product.expired_date}
                                          />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                          <StatusBadge
                                            status={product.status}
                                          />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                          {renderActionButtonDesktop(
                                            product,
                                            task
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {getGroupTotalPages(task) > 1 && (
                                <div className="border-t border-gray-200 px-4 py-3">
                                  <Pagination
                                    currentPage={
                                      getGroupCurrentPage(task.id) - 1
                                    }
                                    totalPages={getGroupTotalPages(task)}
                                    onPageChange={(page) =>
                                      setGroupCurrentPage(task.id, page + 1)
                                    }
                                    itemsPerPage={itemsPerPage}
                                    totalItems={task.products.length}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {groupKeys.length > itemsPerPage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
              <Pagination
                currentPage={currentPage - 1}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page + 1)}
                itemsPerPage={itemsPerPage}
                totalItems={groupKeys.length}
              />
            </div>
          )}
        </div>
      </div>
      {/* Modal for Stock Entry */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Opname Stock</h2>
              <p className="text-sm text-gray-600">
                Input physical stock count
              </p>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedProduct.product_name}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Kode:</span>
                    <span className="ml-2 font-mono">
                      {selectedProduct.product_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total System:</span>
                    <span className="ml-2 font-semibold text-indigo-600">
                      {selectedProduct.batches.reduce(
                        (sum, p) => sum + p.stock_quantity,
                        0
                      )}{" "}
                      pcs
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Detail Batch ({selectedProduct.batches.length}):
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedProduct.batches.map((batch, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {batch.batch_code}
                        </span>
                        <div className="flex space-x-3">
                          <BatchStatus
                            stockQuantity={batch.stock_quantity}
                            expDate={batch.expired_date}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="physicalStock"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total Physical Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="physicalStock"
                    type="number"
                    value={physicalStock}
                    onChange={(e) => setPhysicalStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="0"
                    placeholder="Enter total physical stock"
                  />
                  {physicalStock && (
                    <p className="mt-1 text-sm text-gray-600">
                      Difference:{" "}
                      <span
                        className={
                          getStockDifferenceData(
                            selectedProduct.batches.reduce(
                              (sum, p) => sum + p.stock_quantity,
                              0
                            ),
                            parseInt(physicalStock) || 0
                          ).class
                        }
                      >
                        {
                          getStockDifferenceData(
                            selectedProduct.batches.reduce(
                              (sum, p) => sum + p.stock_quantity,
                              0
                            ),
                            parseInt(physicalStock) || 0
                          ).text
                        }{" "}
                        pcs
                      </span>
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expiredStock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Expired Stock
                    </label>
                    <input
                      id="expiredStock"
                      type="number"
                      value={expiredStock}
                      onChange={(e) => setExpiredStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      placeholder="Expired stock quantity"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="damagedStock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Damaged Stock
                    </label>
                    <input
                      id="damagedStock"
                      type="number"
                      value={damagedStock}
                      onChange={(e) => setDamagedStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      placeholder="Damaged stock quantity"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    placeholder="Additional notes for this opname..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Submit Opname
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Confirmation Modal */}
      {showOverdueModal && pendingOpnameData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Schedule Overdue
                  </h3>
                  <p className="text-sm text-gray-500">
                    This opname is past its scheduled date
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  {pendingOpnameData.confirmMessage}
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Product:</strong>{" "}
                    {pendingOpnameData.product.product_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Scheduled Date:</strong>{" "}
                    {formatDate(pendingOpnameData.scheduleDate)}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Days Overdue:</strong>{" "}
                    {pendingOpnameData.overdueDays} day(s)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelOverdueOpname}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOverdueOpname}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const OpnameStaff = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {}, []);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return (
    <div className="container mx-auto px-4 py-20">
      <div>
        <ProductOpname
          setError={setError}
          setSuccess={setSuccess}
          fetchData={fetchData}
        />
      </div>
      <AlertModal isOpen={!!error} message={error} onClose={clearError} />
      <SuccessModal
        isOpen={!!success}
        message={success}
        onClose={clearSuccess}
      />
    </div>
  );
};

export default OpnameStaff;
