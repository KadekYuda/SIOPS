import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, AlertCircle, Search, X, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../../../service/api";
import BatchStatus from "../../BatchStatus";
import AlertModal from "../../../modal/AlertModal";
import SuccessModal from "../../../modal/SuccessModal";
import Pagination from "../../Product/Pagination";

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

const ProductOpname = ({ setError, setSuccess, fetchData }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredStock, setExpiredStock] = useState("");
  const [damagedStock, setDamagedStock] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState("product_name");
  const [sortDirection, setSortDirection] = useState("asc");

  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const searchTerm = search.toLowerCase();
      const productName = task.product_name?.toLowerCase() || "";
      const productCode = task.product_code?.toLowerCase() || "";
      return productName.includes(searchTerm) || productCode.includes(searchTerm);
    })
    .sort((a, b) => {
      const aValue = a[sortField]?.toLowerCase() || "";
      const bValue = b[sortField]?.toLowerCase() || "";
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/opname/tasks");
      console.log("Raw API response:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Format response tidak valid dari server");
      }

      const productGroups = {};
      response.data.forEach((task) => {
        const product = task.batch_stock.product;
        const productCode = product.code_product;

        if (!productGroups[productCode]) {
          productGroups[productCode] = {
            product_code: productCode,
            product_name: product.name_product,
            total_system_stock: 0,
            status: "scheduled",
            created_at: task.created_at,
            batches: [],
          };
        }

        if (task.batch_stock) {
          productGroups[productCode].batches.push({
            opname_id: task.opname_id,
            batch_code: task.batch_stock.batch_code,
            stock_quantity: task.batch_stock.stock_quantity || 0,
            expired_date: task.batch_stock.exp_date,
          });
          productGroups[productCode].total_system_stock += task.batch_stock.stock_quantity || 0;
        }
      });

      const groupedTasks = Object.values(productGroups);
      console.log("Grouped by product:", groupedTasks);
      setTasks(groupedTasks);
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
        throw new Error("Total stok kadaluarsa dan rusak tidak boleh melebihi stok fisik");
      }

      const sortedBatches = [...selectedTask.batches].sort(
        (a, b) => new Date(a.expired_date) - new Date(b.expired_date)
      );

      let remainingExpired = expired;
      let remainingDamaged = damaged;
      let remainingPhysical = physical;

      const batchUpdates = sortedBatches.map((batch) => {
        const batchUpdate = {
          opname_id: batch.opname_id,
          physical_stock: 0,
          expired_stock: 0,
          damaged_stock: 0,
          notes: notes.trim(),
          opname_date: new Date().toISOString().split("T")[0],
        };

        if (remainingExpired > 0) {
          const expiredForBatch = Math.min(remainingExpired, batch.stock_quantity);
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
          const physicalForBatch = Math.min(remainingPhysical, batch.stock_quantity);
          batchUpdate.physical_stock = physicalForBatch;
          remainingPhysical -= physicalForBatch;
        }

        return api.post(`/opname/submit/${batch.opname_id}`, batchUpdate);
      });

      await Promise.all(batchUpdates);

      setSuccess("Hasil opname berhasil dikirim!");
      setSelectedTask(null);
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID");
  }

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

  const handlePageSizeChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
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
                  <h1 className="text-lg font-bold text-white">Product Opname</h1>
                  <p className="text-indigo-100 text-sm">Inventory per product</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">{filteredAndSortedTasks.length} tasks</span>
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
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">
              {search ? "Product not found" : "No opname tasks available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedTasks.map((task) => (
              <div
                key={task.product_code}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{task.product_name}</h3>
                      <p className="text-sm text-gray-600">Code: {task.product_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-50 px-3 py-1 rounded-full">
                        <span className="text-blue-700 font-medium text-sm">
                          {task.total_system_stock} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Related batches: {task.batches.length} batch</p>
                    <div className="space-y-1">
                      {task.batches.slice(0, 2).map((batch, index) => (
                        <div key={index} className="flex justify-between text-xs text-gray-500">
                          <span>{batch.batch_code}</span>
                          <span>{batch.stock_quantity} pcs</span>
                        </div>
                      ))}
                      {task.batches.length > 2 && (
                        <p className="text-xs text-gray-400">+{task.batches.length - 2} more batches</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Opname
                  </button>
                </div>
              </div>
            ))}
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
                <h1 className="text-2xl font-bold text-white">Product Opname</h1>
                <p className="text-indigo-100">Inventory stock per product</p>
              </div>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-white font-medium">{filteredAndSortedTasks.length} tasks</span>
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
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? "Product not found" : "No opname tasks available"}
              </p>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <select
                    value={itemsPerPage}
                    onChange={handlePageSizeChange}
                    className="bg-white border border-white/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    Total {filteredAndSortedTasks.length} products
                  </span>
                </div>
              </div>
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Product Code
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Product Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentItems.map((task) => (
                        <tr key={task.product_code} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {task.product_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.product_name}</div>
                              <div className="text-sm text-gray-500">Created: {formatDate(task.created_at)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{task.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Start Opname
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAndSortedTasks.length}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal for Stock Entry */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Opname Produk</h2>
              <p className="text-sm text-gray-600">Input hasil perhitungan fisik</p>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedTask.product_name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Kode:</span>
                    <span className="ml-2 font-mono">{selectedTask.product_code}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Sistem:</span>
                    <span className="ml-2 font-semibold text-indigo-600">{selectedTask.total_system_stock} pcs</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Detail Batch ({selectedTask.batches.length}):</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedTask.batches.map((batch, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{batch.batch_code}</span>
                        <div className="flex space-x-3">
                          <BatchStatus
                            stockQuantity={batch.stock_quantity}
                            expDate={batch.expired_date}
                            batchId={batch.batch_id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="physicalStock" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className={getStockDifferenceData(selectedTask.total_system_stock, parseInt(physicalStock) || 0).class}
                      >
                        {getStockDifferenceData(selectedTask.total_system_stock, parseInt(physicalStock) || 0).text} pcs
                      </span>
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiredStock" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="damagedStock" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
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
                      setSelectedTask(null);
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

const HistoryOpname = ({ setError, setSuccess, fetchData }) => {
  const [opnames, setOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedOpname, setSelectedOpname] = useState(null);

  const fetchOpnameHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/opname/staff/history");
      if (!Array.isArray(response.data)) {
        throw new Error("Format response tidak valid dari server");
      }

      const groupedOpnames = response.data.reduce((acc, opname) => {
        const date = opname.opname_date || opname.scheduled_date;
        const productCode = opname.batch_stock.product.code_product;
        const key = `${date}-${productCode}`;
        if (!acc[key]) {
          acc[key] = {
            date,
            product_code: productCode,
            product_name: opname.batch_stock.product.name_product,
            status: opname.status,
            items: [],
          };
        }
        acc[key].items.push(opname);
        if (opname.status === "adjusted") acc[key].status = "adjusted";
        else if (opname.status === "submitted" && acc[key].status !== "adjusted")
          acc[key].status = "submitted";
        else if (opname.status === "in_progress" && acc[key].status !== "adjusted" && acc[key].status !== "submitted")
          acc[key].status = "in_progress";
        return acc;
      }, {});

      setOpnames(Object.values(groupedOpnames));
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

  const filteredOpnames = opnames.filter(
    (opnameGroup) =>
      (opnameGroup.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        opnameGroup.product_code?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDate || opnameGroup.date === filterDate) &&
      (!filterStatus || opnameGroup.status === filterStatus)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOpnames.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOpnames.length / itemsPerPage);

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("id-ID") : "N/A";

  const handlePageSizeChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-6 rounded-xl mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="text-white mr-3" size={24} />
                <div>
                  <h1 className="text-lg font-bold text-white">Opname History</h1>
                  <p className="text-indigo-100 text-sm">View your opname transaction history</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">{filteredOpnames.length} records</span>
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
                <option value="in_progress">In Progress</option>
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
        ) : filteredOpnames.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">
              {search ? "No history found" : "No opname history available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((opnameGroup) => (
              <div
                key={`${opnameGroup.date}-${opnameGroup.product_code}`}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{opnameGroup.product_name}</h3>
                      <p className="text-sm text-gray-600">Code: {opnameGroup.product_code}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          opnameGroup.status === "in_progress"
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
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Date: {formatDate(opnameGroup.date)}</p>
                    <p className="text-sm text-gray-600">Items: {opnameGroup.items.length}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOpname(opnameGroup)}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
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
                <h1 className="text-2xl font-bold text-white">Opname History</h1>
                <p className="text-indigo-100">View your opname transaction history</p>
              </div>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-white font-medium">{filteredOpnames.length} records</span>
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
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="adjusted">Adjusted</option>
            </select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading history...</span>
            </div>
          ) : filteredOpnames.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? "No history found" : "No opname history available"}
              </p>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <select
                    value={itemsPerPage}
                    onChange={handlePageSizeChange}
                    className="bg-white border border-white/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  <span className="text-sm text-gray-500">Total {filteredOpnames.length} records</span>
                </div>
              </div>
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          No
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Product
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Total Items
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentItems.map((opnameGroup, index) => (
                        <tr
                          key={`${opnameGroup.date}-${opnameGroup.product_code}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            #{index + 1 + (currentPage - 1) * itemsPerPage}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {opnameGroup.product_name} ({opnameGroup.product_code})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(opnameGroup.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                opnameGroup.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : opnameGroup.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {opnameGroup.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {opnameGroup.items.length} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setSelectedOpname(opnameGroup)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredOpnames.length}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal for Opname Details */}
      {selectedOpname && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Opname Details</h2>
                <p className="text-sm text-gray-600">{formatDate(selectedOpname.date)} - {selectedOpname.product_name} ({selectedOpname.product_code})</p>
              </div>
              <button
                onClick={() => setSelectedOpname(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">Batch Code</th>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">System Stock</th>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">Physical Stock</th>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">Expired Stock</th>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">Damaged Stock</th>
                      <th className="px-4 py-3 text-left text-gray-900 text-sm font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOpname.items.map((item) => (
                      <tr key={item.opname_id}>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.batch_stock.batch_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.batch_stock.stock_quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.physical_stock || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.expired_stock || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.damaged_stock || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedOpname(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-6 rounded-t-xl mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Package className="text-white mr-4" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white">Staff Opname Management</h1>
              <p className="text-indigo-100">Manage your opname tasks and history</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Tab
              label="Product Opname"
              icon={Package}
              isActive={activeTab === "product"}
              onClick={() => setActiveTab("product")}
            />
            <Tab
              label="History Opname"
              icon={FileText}
              isActive={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            />
          </div>
        </div>
      </div>
      <div>
        {activeTab === "product" && (
          <ProductOpname setError={setError} setSuccess={setSuccess} fetchData={fetchData} />
        )}
        {activeTab === "history" && (
          <HistoryOpname setError={setError} setSuccess={setSuccess} fetchData={fetchData} />
        )}
      </div>
      <AlertModal isOpen={!!error} message={error} onClose={clearError} />
      <SuccessModal isOpen={!!success} message={success} onClose={clearSuccess} />
    </div>
  );
};

export default OpnameStaff;