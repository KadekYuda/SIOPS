import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  Clipboard,
  FilePlus,
  Edit,
  Trash2,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import CrudButton from "../../../Button/CrudButton";
import UserModal from "../../../modal/UserModal.jsx";
import SuccessModal from "../../../modal/SuccessModal.jsx";
import AlertModal from "../../../modal/AlertModal.jsx";
import api from "../../../../service/api.js";
import OrderCh from "../../../Chart/OrderCh.jsx";




const DashboardAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("add");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Chart filter state
  const [activeChartFilter, setActiveChartFilter] = useState("orders");
  const [timeFilter, setTimeFilter] = useState("weekly"); // 'daily', 'weekly', 'monthly', 'yearly'

  // Prepare order statistics for OrderCh component
  const prepareOrderStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        pendingOrders: 0,
        approvedOrders: 0,
        receivedOrders: 0,
        cancelledOrders: 0,
        pendingValue: 0,
        approvedValue: 0,
        receivedValue: 0,
        cancelledValue: 0,
        monthlyData: [],
      };
    }

    // Count orders by status
    const statusCounts = {
      pending: 0,
      approved: 0,
      received: 0,
      cancelled: 0,
    };

    const statusValues = {
      pending: 0,
      approved: 0,
      received: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = order.status_order || order.status || 'pending';
      const orderValue = parseFloat(order.total_price || order.total_amount || 0);
      
      // Normalize status names
      let normalizedStatus = status.toLowerCase();
      if (normalizedStatus === 'in_progress' || normalizedStatus === 'progress') {
        normalizedStatus = 'approved';
      }
      if (normalizedStatus === 'completed' || normalizedStatus === 'done') {
        normalizedStatus = 'received';
      }
      if (normalizedStatus === 'rejected' || normalizedStatus === 'canceled') {
        normalizedStatus = 'cancelled';
      }

      if (statusCounts.hasOwnProperty(normalizedStatus)) {
        statusCounts[normalizedStatus]++;
        statusValues[normalizedStatus] += orderValue;
      } else {
        // Default to pending if status not recognized
        statusCounts.pending++;
        statusValues.pending += orderValue;
      }
    });

    // Generate monthly data for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.tgl_order || order.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const monthTotalValue = monthOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total_price || order.total_amount || 0);
      }, 0);

      monthlyData.push({
        month: monthStart.toISOString().split('T')[0],
        orders: monthOrders.length,
        totalValue: monthTotalValue,
      });
    }

    return {
      pendingOrders: statusCounts.pending,
      approvedOrders: statusCounts.approved,
      receivedOrders: statusCounts.received,
      cancelledOrders: statusCounts.cancelled,
      pendingValue: statusValues.pending,
      approvedValue: statusValues.approved,
      receivedValue: statusValues.received,
      cancelledValue: statusValues.cancelled,
      monthlyData,
    };
  }, [orders]);

  useEffect(() => {
    fetchOrderData();
    fetchUserData();
    getRole();
  }, []);

  const getRole = async () => {
    try {
      // Get user info from a dedicated endpoint instead of parsing JWT
      const response = await api.get("/users/verify-token");
      console.log("User role:", response.data.user.role); 
      setRole(response.data.user.role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchOrderData = async () => {
    try {
      const response = await api.get("/orders");
      const sortedOrders = response.data.sort(
        (a, b) => new Date(b.tgl_order) - new Date(a.tgl_order)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error(
        "Error fetching order data:",
        error.response ? error.response.data : error.message
      );
      setOrders([]);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error(
        "Error fetching user data:",
        error.response ? error.response.data : error.message
      );
      setModalMessage("Gagal mengambil data staff");
      setErrorModalOpen(true);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      await api.post("/users", {
        ...userData,
        role: "staff",
      });
      setIsModalOpen(false);
      fetchUserData();
      setModalMessage("Staff has been added successfully");
      setSuccessModalOpen(true);
    } catch (error) {
      setModalMessage(error.response?.data?.msg || "Failed add staff");
      setErrorModalOpen(true);
    }
  };

  const handleEditUser = async (userData) => {
    if (!selectedUser?.user_id) {
      setModalMessage("ID Staff tidak valid");
      setErrorModalOpen(true);
      return;
    }

    try {
      const dataToUpdate = {
        ...userData,
        role: "staff",
      };

      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }

      await api.put(`/users/${selectedUser.user_id}`, dataToUpdate);
      setIsModalOpen(false);
      fetchUserData();
      setModalMessage("Staff has been updated successfully");
      setSuccessModalOpen(true);
    } catch (error) {
      setModalMessage(error.response?.data?.msg || "Gagal memperbarui staff");
      setErrorModalOpen(true);
    }
  };

  const deleteUser = async (userId) => {
    if (!userId) {
      setModalMessage("ID Staff tidak valid");
      setErrorModalOpen(true);
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      fetchUserData();
      setModalMessage("Staff deleted successfully");
      setSuccessModalOpen(true);
    } catch (error) {
      setModalMessage(error.response?.data?.msg || "Failed delete staff");
      setErrorModalOpen(true);
    }
  };
  

  const openAddModal = () => {
    setSelectedUser(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      password: "",
      status: user.status
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const calculateTotalStock = () => {
    return orders.reduce((total, order) => total + (order.quantity || 0), 0);
  };

  return (
    <div className="min-h-screen  px-4 pt-20">
      <div className="container mx-auto">
        {/* Page Header */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Stock Management Dashboard
          </h2>
          <p className="text-gray-500">
            Comprehensive overview of your inventory and staff
          </p>
        </div>

        {/* Analytics Dashboard Section */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
                Analytics Dashboard
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    activeChartFilter === "sales"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveChartFilter("sales")}
                >
                  <DollarSign size={16} className="mr-1" />
                  Sales
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    activeChartFilter === "products"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveChartFilter("products")}
                >
                  <Package size={16} className="mr-1" />
                  Products
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    activeChartFilter === "orders"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveChartFilter("orders")}
                >
                  <ShoppingBag size={16} className="mr-1" />
                  Orders
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                    activeChartFilter === "opname"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveChartFilter("opname")}
                >
                  <ClipboardList size={16} className="mr-1" />
                  Opname
                </button>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="mb-6">
              <div className="bg-gray-50 p-2 rounded-lg flex flex-wrap gap-2 justify-center">
                <button
                  className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
                    timeFilter === "daily"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setTimeFilter("daily")}
                >
                  Daily
                </button>
                <button
                  className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
                    timeFilter === "weekly"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setTimeFilter("weekly")}
                >
                  Weekly
                </button>
                <button
                  className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
                    timeFilter === "monthly"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setTimeFilter("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`px-4 py-1 rounded-md text-xs font-medium transition-all ${
                    timeFilter === "yearly"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setTimeFilter("yearly")}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-80 relative">
              {/* Sales Chart - Empty */}
              {activeChartFilter === "sales" && (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <DollarSign size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-gray-500 font-medium">Sales Chart</p>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </div>
                </div>
              )}

              {/* Products Chart - Empty */}
              {activeChartFilter === "products" && (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Package size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-gray-500 font-medium">Products Chart</p>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </div>
                </div>
              )}

              {/* Orders Chart - OrderCh Component */}
              {activeChartFilter === "orders" && (
                <div className="h-full">
                  <OrderCh 
                    orderStats={prepareOrderStats}
                    timeFilter={timeFilter}
                    activeTab="count"
                  />
                </div>
              )}

              {/* Opname Chart - Empty */}
              {activeChartFilter === "opname" && (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <ClipboardList size={48} className="text-gray-300 mb-3 mx-auto" />
                    <p className="text-gray-500 font-medium">Opname Chart</p>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Total Orders
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {orders.length}
                </p>
              </div>
              <ShoppingBag className="text-blue-500 opacity-70" size={48} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Total Stock
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {calculateTotalStock()}
                </p>
              </div>
              <Package className="text-green-500 opacity-70" size={48} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Total Staff
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter((user) => user.role === "staff").length}
                </p>
              </div>
              <Clipboard className="text-purple-500 opacity-70" size={48} />
            </div>
          </div>
        </div>

        {/* Recent Orders and User Management - Fixed grid for large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders Table */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Recent Orders
              </h3>
              <TrendingUp className="text-blue-500" size={24} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-3">Kode Barang</th>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Jumlah</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order, index) => (
                    <tr
                      key={`order-${order.order_id || index}`}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">{order.kdbar}</td>
                      <td className="p-3">{order.Product?.nmbar || "-"}</td>
                      <td className="p-3">{order.jumlah}</td>
                      <td className="p-3">
                        Rp {Number(order.harga).toLocaleString()}
                      </td>
                      <td className="p-3">{order.tipe_order}</td>
                      <td className="p-3">
                        {new Date(order.tgl_order).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  Staff Management
                </h3>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {users.filter((user) => user.role === "staff").length}
                </span>
              </div>
              {role === "admin" && (
                <CrudButton
                  icon={FilePlus}
                  label="Create Staff"
                  onClick={openAddModal}
                  buttonStyle="secondary"
                  />
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users
                .filter((user) => user.role === "staff")
                .map((user, index) => (
                  <div
                    key={`staff-${user.user_id || index}`}
                    className="bg-gradient-to-r from-white to-blue-50/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-blue-100/50 hover:shadow-md transition duration-300 ease-in-out"
                  >
                    <div className="flex items-center space-x-4 w-full sm:w-auto mb-3 sm:mb-0">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        <span className="text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2">
                          <p className="text-base font-semibold text-gray-900 tracking-tight">
                            {user.name}
                          </p>
                          {user.verified && (
                            <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium tracking-wide">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-3">
                      <span
                        className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === "active"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {user.status}
                      </span>
                    </div>

                    {role === "admin" && (
                      <div className="flex space-x-2 w-full sm:w-auto justify-end">
                        <CrudButton
                          icon={Edit}
                          label="Edit"
                          onClick={() => openEditModal(user)}
                          actionType="edit" 
                          buttonStyle="primary"
                         
                        />
                        <CrudButton
                          icon={Trash2}
                          label="Delete"
                          onConfirm={() => deleteUser(user.user_id)}
                          confirmMessage={
                            <>
                              Are you sure you want to delete this{" "}
                              <b className="text-gray-700">{user.name}</b>?
                            </>
                          }
                          title="Delete Staff"
                          actionType="delete"
                          buttonStyle="danger"
                          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition w-full sm:w-auto"
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Empty State */}
            {users.filter((user) => user.role === "staff").length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 text-sm">No staff members found</p>
                {role === "admin" && (
                  <CrudButton 
                    icon={FilePlus}
                    label="Create First Staff Member"
                    onClick={openAddModal}
                    buttonStyle="secondary"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={modalMode === "add" ? handleAddUser : handleEditUser}
          user={selectedUser}
          title={modalMode === "add" ? "Create Staff" : "Edit Staff"}
          mode={modalMode}
        />

        <SuccessModal
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          message={modalMessage}
        />

        <AlertModal
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          message={modalMessage}
        />
      </div>
    </div>
  );
};

export default DashboardAdmin;