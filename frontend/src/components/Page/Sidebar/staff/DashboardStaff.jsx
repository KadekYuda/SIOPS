import React, { useEffect, useState } from "react";
import axios from "axios";

const DashboardStaff = () => {
  const [orders, setOrders] = useState([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchOrderData();
    fetchUserName();
  }, []);

  const fetchOrderData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/orders");
      const orders = response.data;
      setOrders(orders);
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  const fetchUserName = async () => {
    try {
      const response = await axios.get("http://localhost:5000/user"); 
      const user = response.data;
      setUserName(user.name); 
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  return (
    <div className="container mx-auto p-5 mt-5">
      <h1 className="text-3xl font-bold text-center mb-4">
        Selamat datang, {userName}!
      </h1>

      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl">
            Rp.{orders.reduce((sum, order) => sum + order.hargaBeli, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mt-4">
        <h3 className="text-xl font-semibold mb-2">Recent Orders</h3>
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Nama Barang</th>
              <th className="px-4 py-2">Tanggal</th>
              <th className="px-4 py-2">Harga</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order.id}>
                <td className="border px-4 py-2">{order.namaBarang}</td>
                <td className="border px-4 py-2">
                  {new Date(order.date).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">Rp.{order.hargaBeli}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardStaff;