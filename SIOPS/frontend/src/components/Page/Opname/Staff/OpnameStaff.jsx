// frontend/src/components/OpnameStaff.js
import React, { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, AlertCircle, Search } from "lucide-react";
import api from "../../../../service/api";

const OpnameStaff = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredStock, setExpiredStock] = useState("");
  const [damagedStock, setDamagedStock] = useState("");
  const [notes, setNotes] = useState("");
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/opname/tasks");
      console.log("Raw API response:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format from server");
      }

      // Validasi dan transformasi data
      const validTasks = response.data.filter((task) => {
        const isValid =
          task?.batch_stock?.code_product && task?.status === "scheduled";

        if (!isValid) {
          console.log("Invalid task data:", task);
        }
        return isValid;
      });

      console.log("Valid tasks:", validTasks);
      setTasks(validTasks);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat tugas opname");
    } finally {
      setLoading(false);
    }
  }, []);

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
        throw new Error(
          "Total stok kadaluarsa dan rusak tidak boleh melebihi stok fisik"
        );
      }

      await api.post(`/opname/submit/${selectedTask.opname_id}`, {
        physical_stock: physical,
        expired_stock: expired,
        damaged_stock: damaged,
        notes: notes.trim(),
      });

      setSuccess("Hasil opname berhasil dikirim!");
      setSelectedTask(null);
      resetForm();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengirim opname");
    }
  };

  const resetForm = () => {
    setPhysicalStock("");
    setExpiredStock("");
    setDamagedStock("");
    setNotes("");
  }; // Filter dan validasi task sebelum ditampilkan
  const filteredTasks = tasks.filter((task) => {
    if (!task?.batch_stock?.code_product) {
      console.log("Invalid task structure:", task);
      return false;
    }

    const searchTerm = search.toLowerCase();
    const productName = task.batch_stock?.code_product.toLowerCase();
    const batchCode = task.batch_stock?.batch_code.toLowerCase();

    return productName.includes(searchTerm) || batchCode.includes(searchTerm);
  });
  const getProductName = (task) => {
    console.log("Getting product name for task:", task);
    const name = task?.batch_stock?.code_product || "Unnamed Product";
    console.log("Product name:", name);
    return name;
  };

  const getSystemStock = (task) => {
    console.log("Getting system stock for task:", task);
    const stock = task?.system_stock || task?.batch_stock?.stock_quantity || 0;
    console.log("System stock:", stock);
    return stock;
  };

  return (
    <div className="container mx-auto px-4 pt-20">
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-4 rounded-xl mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="text-white mr-2" size={20} />
                <h1 className="text-sm font-bold text-white">Tugas Opname</h1>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border text-gray-700 border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-4 text-gray-500">Memuat...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Tidak ada tugas</div>
        ) : (
          filteredTasks.map((task) => (
            <button
              key={task.opname_id}
              className="w-full text-left bg-white rounded-lg border shadow-sm p-3 mb-2"
              onClick={() => setSelectedTask(task)}
            >
              <h3 className="text-sm font-medium">{getProductName(task)}</h3>
              <p className="text-xs text-gray-600">
                Stok Sistem: {getSystemStock(task)}
              </p>
              <p className="text-xs text-gray-600">
                Batch: {task.batch_stock?.batch_code || "N/A"}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="text-white mr-3" size={24} />
              <h1 className="text-2xl font-bold text-white">Tugas Opname</h1>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {loading ? (
            <div className="text-center py-4 text-gray-500">Memuat...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Tidak ada tugas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Stok Sistem
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task, index) => (
                    <tr key={task.opname_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {getProductName(task)}
                      </td>{" "}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {task.batch_stock?.batch_code || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {getSystemStock(task)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Isi Hasil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Isi Hasil Opname</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-blue-900 mb-2">
                {getProductName(selectedTask)}
              </h3>{" "}
              <p className="text-sm text-blue-800">
                Batch: {selectedTask.batch_stock?.batch_code || "N/A"}
              </p>
              <p className="text-sm text-blue-800">
                Stok Sistem: {getSystemStock(selectedTask)}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="physicalStock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stok Fisik
                </label>
                <input
                  id="physicalStock"
                  type="number"
                  value={physicalStock}
                  onChange={(e) => setPhysicalStock(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />

                <label
                  htmlFor="expiredStock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stok Kadaluarsa (Opsional)
                </label>
                <input
                  id="expiredStock"
                  type="number"
                  value={expiredStock}
                  onChange={(e) => setExpiredStock(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />

                <label
                  htmlFor="damagedStock"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stok Rusak (Opsional)
                </label>
                <input
                  id="damagedStock"
                  type="number"
                  value={damagedStock}
                  onChange={(e) => setDamagedStock(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  min="0"
                />

                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Catatan (Opsional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Kirim Hasil
                </button>
              </div>
            </form>
            {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mt-2 flex items-center">
                <AlertCircle className="mr-1" size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 text-green-700 p-2 rounded mt-2 flex items-center">
                <CheckCircle className="mr-1" size={16} /> {success}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpnameStaff;
