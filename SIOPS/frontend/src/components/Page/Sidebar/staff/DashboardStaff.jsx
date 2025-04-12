import React, { useState, useEffect } from "react";
import { ShoppingBag, Package, TrendingUp, Users } from "lucide-react";
import api from "../../../../service/api";

const DashboardStaff = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null); // Simpan data user

  useEffect(() => {
    fetchUserProfile(); // Ambil data user
    fetchOrderData(); // Ambil data order
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      setUser(response.data); 
    } catch (error) {
      console.error("Error fetching user profile:", error.response ? error.response.data : error.message);
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
      console.error("Error fetching order data:", error.response ? error.response.data : error.message);
      setOrders([]);
    }
  };

  const calculateTotalStock = () => {
    return orders.reduce((total, order) => total + (order.jumlah || 0), 0);
  };

  const calculateTotalSales = () => {
    return orders.reduce((total, order) => total + (order.harga || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pt-20">
      <div className="container mx-auto">
        {/* Page Header */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Welcome, {user ? user.name : "Loading..."}!
          </h2>
          <p className="text-gray-500">
            Your personal stock and order management dashboard
          </p>
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
                  Total Sales
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  Rp {calculateTotalSales().toLocaleString()}
                </p>
              </div>
              <Users className="text-purple-500 opacity-70" size={48} />
            </div>
          </div>
        </div>

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

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-sm">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStaff;
