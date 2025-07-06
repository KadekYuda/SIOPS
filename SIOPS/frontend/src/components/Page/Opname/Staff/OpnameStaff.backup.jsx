import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Calendar,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "../../../../service/api";
import BatchStatus from "../../BatchStatus";
import AlertModal from "../../../modal/AlertModal";
import SuccessModal from "../../../modal/SuccessModal";

const Tab = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? "bg-white text-indigo-700 shadow-sm"
        : "bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400"
    }`}
  >
    {Icon && <Icon size={18} />}
    <span className="truncate">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "scheduled":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "Scheduled" };
      case "submitted":
        return { bg: "bg-green-100", text: "text-green-800", label: "Submitted" };
      case "adjusted":
        return { bg: "bg-purple-100", text: "text-purple-800", label: "Adjusted" };
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

const ProductOpname = ({
  setError,
  setSuccess,
  fetchData,
  setActiveTab,
  activeTab,
}) => {
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

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/opname/tasks");
      if (!Array.isArray(response.data)) {
        throw new Error("Format response tidak valid dari server");
      }

      const dateGroups = {};
      const pagination = {};
      
      response.data.forEach((task) => {
        const scheduleDate = task.scheduled_date || task.created_at.split("T")[0];
        const product = task.batch_stock.product;
        const category = product.category || "Uncategorized";
        const groupKey = `${scheduleDate}-${category}`;

        if (!dateGroups[scheduleDate]) {
          dateGroups[scheduleDate] = [];
        }

        let categoryGroup = dateGroups[scheduleDate].find(
          (group) => group.category === category
        );
        if (!categoryGroup) {
          categoryGroup = {
            id: groupKey,
            scheduleDate,
            category,
            products: [],
          };
          dateGroups[scheduleDate].push(categoryGroup);
          pagination[groupKey] = { currentPage: 1 };
        }

        categoryGroup.products.push({
          opname_id: task.opname_id,
          product_code: product.code_product,
          product_name: product.name_product,
          batch_code: task.batch_stock.batch_code,
          stock_quantity: task.batch_stock.stock_quantity || 0,
          expired_date: task.batch_stock.exp_date,
          status: task.status || "scheduled",
          created_at: task.created_at,
        });
      });

      Object.keys(dateGroups).forEach(date => {
        dateGroups[date].forEach(group => {
          group.products.sort((a, b) => {
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
    setGroupPagination(prev => ({
      ...prev,
      [groupId]: { ...prev[groupId], currentPage: page }
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

  // Filtered groups with search and pagination
  const { filteredTasks, groupKeys, totalPages, startIndex, currentGroups } = useMemo(() => {
    const filtered = {};
    Object.keys(tasks).forEach((date) => {
      const filteredTasks = tasks[date].filter(
        (categoryGroup) =>
          categoryGroup.category.toLowerCase().includes(search.toLowerCase()) ||
          categoryGroup.products.some(
            (product) =>
              product.product_name.toLowerCase().includes(search.toLowerCase()) ||
              product.product_code.toLowerCase().includes(search.toLowerCase())
          )
      );
      if (filteredTasks.length > 0) {
        filtered[date] = filteredTasks;
      }
    });

    const groupKeys = Object.keys(filtered).sort((a, b) => new Date(b) - new Date(a));
    const totalPages = Math.ceil(groupKeys.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentGroups = groupKeys.slice(startIndex, startIndex + itemsPerPage);

    return {
      filteredTasks: filtered,
      groupKeys,
      totalPages,
      startIndex,
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

  const getTotalProducts = (tasks) => {
    return tasks.reduce((total, task) => total + task.products.length, 0);
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

      if (expired + damaged > physical) {
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
          const physicalForBatch = Math.min(
            remainingPhysical,
            batch.stock_quantity
          );
          batchUpdate.physical_stock = physicalForBatch;
          remainingPhysical -= physicalForBatch;
        }

        return api.post(`/opname/submit/${batch.opname_id}`, batchUpdate);
      });

      await Promise.all(batchUpdates);

      setSuccess("Hasil opname berhasil dikirim!");
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
            <div className="flex items-center justify-between mt-2">
              <div className="flex bg-indigo-600/50 rounded-lg p-0.5 gap-2">
                <Tab
                  label="Product"
                  icon={Package}
                  isActive={activeTab === "product"}
                  onClick={() => setActiveTab("product")}
                />
                <Tab
                  label="History"
                  icon={FileText}
                  isActive={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                />
              </div>
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
          <div className="space-y-4">
            {currentGroups.map((dateKey) => (
              <div
                key={dateKey}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(dateKey)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedGroups.has(dateKey) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Schedule: {formatDate(dateKey)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {filteredTasks[dateKey].length} categories,{" "}
                        {getTotalProducts(filteredTasks[dateKey])} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Scheduled
                    </span>
                  </div>
                </div>
                {expandedGroups.has(dateKey) && (
                  <div className="p-4 space-y-3">
                    {filteredTasks[dateKey].map((task) =>
                      getGroupProducts(task).map((product, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {product.product_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Code: {product.product_code}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {formatDate(product.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setSelectedProduct({
                                  ...product,
                                  batches: task.products.filter(
                                    (p) => p.product_code === product.product_code
                                  ),
                                })
                              }
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Start Opname
                            </button>
                          </div>
                          <StatusBadge status={product.status} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {groupKeys.length > itemsPerPage && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, groupKeys.length)} of{" "}
                {groupKeys.length} schedule groups
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === page
                          ? "bg-purple-600 text-white border-purple-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
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
              <div className="flex bg-indigo-600/50 rounded-lg p-1 gap-2">
                <Tab
                  label="Product Opname"
                  icon={Package}
                  isActive={activeTab === "product"}
                  onClick={() => setActiveTab("product")}
                />
                <Tab
                  label="History opname"
                  icon={FileText}
                  isActive={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                />
              </div>
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
            <div className="space-y-4">
              {currentGroups.map((dateKey) => (
                <div
                  key={dateKey}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleGroup(dateKey)}
                  >
                    <div className="flex items-center space-x-3">
                      {expandedGroups.has(dateKey) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Schedule: {formatDate(dateKey)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {filteredTasks[dateKey].length} categories,{" "}
                          {getTotalProducts(filteredTasks[dateKey])} products
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Scheduled
                      </span>
                    </div>
                  </div>
                  {expandedGroups.has(dateKey) && (
                    <div className="border-t border-gray-200">
                      {filteredTasks[dateKey].map((task) => (
                        <div
                          key={task.id}
                          className="p-4 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              {task.category}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {task.products.length} products
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Code
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {getGroupProducts(task).map((product, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {product.product_code}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      <div>
                                        <div className="font-medium">
                                          {product.product_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Created: {formatDate(product.created_at)}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <StatusBadge status={product.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <button
                                        onClick={() =>
                                          setSelectedProduct({
                                            ...product,
                                            batches: task.products.filter(
                                              (p) => p.product_code === product.product_code
                                            ),
                                          })
                                        }
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                      >
                                        Start Opname
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {getGroupTotalPages(task) > 1 && (
                              <div className="flex justify-end mt-4 space-x-2">
                                <button
                                  onClick={() => setGroupCurrentPage(task.id, getGroupCurrentPage(task.id) - 1)}
                                  disabled={getGroupCurrentPage(task.id) === 1}
                                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Previous
                                </button>
                                {Array.from({ length: getGroupTotalPages(task) }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setGroupCurrentPage(task.id, page)}
                                    className={`px-3 py-1 border rounded text-sm ${
                                      getGroupCurrentPage(task.id) === page
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setGroupCurrentPage(task.id, getGroupCurrentPage(task.id) + 1)}
                                  disabled={getGroupCurrentPage(task.id) === getGroupTotalPages(task)}
                                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {groupKeys.length > itemsPerPage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, groupKeys.length)} of{" "}
                  {groupKeys.length} schedule groups
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? "bg-purple-600 text-white border-purple-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal for Stock Entry */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Opname Produk</h2>
              <p className="text-sm text-gray-600">
                Input hasil perhitungan fisik
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
                    <span className="text-gray-600">Total Sistem:</span>
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
                        <span className="text-gray-600">{batch.batch_code}</span>
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
    </>
  );
};

const HistoryOpname = ({
  setError,
  setSuccess,
  fetchData,
  setActiveTab,
  activeTab,
}) => {
  const [opnames, setOpnames] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const fetchOpnameHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/opname/staff/history");
      if (!Array.isArray(response.data)) {
        throw new Error("Format response tidak valid dari server");
      }

      const dateGroups = {};
      response.data.forEach((opname) => {
        const date = opname.opname_date || opname.scheduled_date;
        const product = opname.batch_stock.product;
        const category = product.category || "Uncategorized";

        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }

        let categoryGroup = dateGroups[date].find(
          (group) => group.category === category
        );
        if (!categoryGroup) {
          categoryGroup = {
            id: `${date}-${category}`,
            date,
            category,
            items: [],
          };
          dateGroups[date].push(categoryGroup);
        }

        categoryGroup.items.push({
          opname_id: opname.opname_id,
          product_code: product.code_product,
          product_name: product.name_product,
          batch_code: opname.batch_stock.batch_code,
          stock_quantity: opname.batch_stock.stock_quantity,
          physical_stock: opname.physical_stock,
          expired_stock: opname.expired_stock,
          damaged_stock: opname.damaged_stock,
          notes: opname.notes,
          status: opname.status,
        });
      });

      setOpnames(dateGroups);
    } catch (err) {
      console.error("Error fetching opname history:", err);
      setError(err.response?.data?.error || "Gagal memuat riwayat opname");
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchOpnameHistory();
  }, [fetchOpnameHistory]);

  const filteredOpnames = useMemo(() => {
    if (!search && !filterDate && !filterStatus) return opnames;

    const filtered = {};
    Object.keys(opnames).forEach((date) => {
      const filteredTasks = opnames[date].filter(
        (task) =>
          (!filterDate || date === filterDate) &&
          task.items.some(
            (item) =>
              (item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.product_code?.toLowerCase().includes(search.toLowerCase())) &&
              (!filterStatus || item.status === filterStatus)
          )
      );
      if (filteredTasks.length > 0) {
        filtered[date] = filteredTasks;
      }
    });
    return filtered;
  }, [opnames, search, filterDate, filterStatus]);

  const groupKeys = Object.keys(filteredOpnames);
  const totalPages = Math.ceil(groupKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentGroups = groupKeys.slice(startIndex, startIndex + itemsPerPage);

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "N/A";

  const getTotalItems = (tasks) => {
    return tasks.reduce((total, task) => total + task.items.length, 0);
  };

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-6 rounded-xl mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="text-white mr-3" size={24} />
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Opname History
                  </h1>
                  <p className="text-indigo-100 text-sm">
                    View your opname transaction history
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {groupKeys.length} schedule groups
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex bg-indigo-600/50 rounded-lg p-0.5 gap-2">
                <Tab
                  label="Product"
                  icon={Package}
                  isActive={activeTab === "product"}
                  onClick={() => setActiveTab("product")}
                />
                <Tab
                  label="History"
                  icon={FileText}
                  isActive={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
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
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/90 backdrop-blur-sm border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/90 backdrop-blur-sm border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="submitted">Submitted</option>
                <option value="adjusted">Adjusted</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading history...</span>
          </div>
        ) : groupKeys.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">
              {search ? "No history found" : "No opname history available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentGroups.map((dateKey) => (
              <div
                key={dateKey}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(dateKey)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedGroups.has(dateKey) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Schedule: {formatDate(dateKey)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {filteredOpnames[dateKey].length} categories,{" "}
                        {getTotalItems(filteredOpnames[dateKey])} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      History
                    </span>
                  </div>
                </div>
                {expandedGroups.has(dateKey) && (
                  <div className="border-t border-gray-200">
                    {filteredOpnames[dateKey].map((task) =>
                      task.items.slice(0, itemsPerPage).map((item, index) => (
                        <div
                          key={index}
                          className="p-4 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Code: {item.product_code}
                                </p>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Batch: {item.batch_code}, System Stock:{" "}
                              {item.stock_quantity}, Physical Stock:{" "}
                              {item.physical_stock || "-"}, Expired:{" "}
                              {item.expired_stock || "-"}, Damaged:{" "}
                              {item.damaged_stock || "-"}, Notes: {item.notes || "-"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {groupKeys.length > itemsPerPage && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, groupKeys.length)} of{" "}
                {groupKeys.length} schedule groups
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === page
                          ? "bg-purple-600 text-white border-purple-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
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
              <FileText className="text-white mr-4" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Opname History
                </h1>
                <p className="text-indigo-100">
                  View your opname transaction history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-indigo-600/50 rounded-lg p-1 gap-2">
                <Tab
                  label="Product Opname"
                  icon={Package}
                  isActive={activeTab === "product"}
                  onClick={() => setActiveTab("product")}
                />
                <Tab
                  label="History opname"
                  icon={FileText}
                  isActive={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                />
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <span className="text-white font-medium">
                  {groupKeys.length} schedule groups
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search product name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="submitted">Submitted</option>
              <option value="adjusted">Adjusted</option>
            </select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading history...</span>
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? "No history found" : "No opname history available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentGroups.map((dateKey) => (
                <div
                  key={dateKey}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleGroup(dateKey)}
                  >
                    <div className="flex items-center space-x-3">
                      {expandedGroups.has(dateKey) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Schedule: {formatDate(dateKey)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {filteredOpnames[dateKey].length} categories,{" "}
                          {getTotalItems(filteredOpnames[dateKey])} items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        History
                      </span>
                    </div>
                  </div>
                  {expandedGroups.has(dateKey) && (
                    <div className="border-t border-gray-200">
                      {filteredOpnames[dateKey].map((task) => (
                        <div
                          key={task.id}
                          className="p-4 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              {task.category}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {task.items.length} items
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Batch Code
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    System Stock
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Physical Stock
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expired Stock
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Damaged Stock
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Notes
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {task.items
                                  .slice(0, itemsPerPage)
                                  .map((item) => (
                                    <tr key={item.opname_id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.batch_code}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.stock_quantity}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.physical_stock || "-"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.expired_stock || "-"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.damaged_stock || "-"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.notes || "-"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {groupKeys.length > itemsPerPage && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, groupKeys.length)} of{" "}
                  {groupKeys.length} schedule groups
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? "bg-purple-600 text-white border-purple-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OpnameStaff = () => {
  const [activeTab, setActiveTab] = useState("product");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {}, []);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return (
    <div className="container mx-auto px-4 py-20">
      <div>
        {activeTab === "product" && (
          <ProductOpname
            setError={setError}
            setSuccess={setSuccess}
            fetchData={fetchData}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        )}
        {activeTab === "history" && (
          <HistoryOpname
            setError={setError}
            setSuccess={setSuccess}
            fetchData={fetchData}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        )}
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