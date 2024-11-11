  import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderChart from "../staff/OrderChart"

const DashboardAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchOrderData();
    fetchUserData();
  }, []);

  const fetchOrderData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/orders');
      setOrders(response.data);
      const sortedOrders = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));

      setOrders(sortedOrders);  
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      // Dapatkan token dari localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found'); // Jika tidak ada token, lemparkan error
      }
  
      // Sertakan token di header permintaan
      const response = await axios.get('http://localhost:5000/users', {
        headers: {
          Authorization: `Bearer ${token}` // Pastikan token disertakan di header Authorization
        }
      });
  
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response && error.response.status === 401) {
        console.log('Unauthorized - redirect to login');
        // Tambahkan logika jika token tidak valid, misal arahkan ke halaman login
      }
    }
  };

  return (
    <div className="container mx-auto p-5 mt-5">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl">${orders.reduce((sum, order) => sum + order.hargaBeli, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Users</h3>
          <p className="text-3xl">{users.length}</p>
        </div>
      </div>
      
      {/* Mengganti Sales Chart dengan OrderChart */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-4">
        <h3 className="text-xl font-semibold mb-2">Order Chart</h3>
        <OrderChart /> {/* Menampilkan OrderChart di sini */}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mt-4 overflow-x-auto"> {/* Tambahkan overflow-x-auto untuk mengaktifkan scroll horizontal jika tabel terlalu lebar */}
  <h3 className="text-xl font-semibold mb-2">Recent Orders</h3>
  <table className="w-full table-auto"> {/* Gunakan w-full untuk membuat tabel memenuhi lebar container dan table-auto untuk menyesuaikan lebar kolom secara otomatis */}
    <thead>
      <tr>
        <th className="px-4 py-2">Nama Barang</th>
        <th className="px-4 py-2">Harga Beli</th>
        <th className="px-4 py-2">Tanggal</th>
      </tr>
    </thead>
    <tbody>
      {orders.slice(0, 5).map(order => (
        <tr key={order.id}>
          <td className="border px-4 py-2">{order.namaBarang}</td>
          <td className="border px-4 py-2">{order.hargaBeli}</td>
          <td className="border px-4 py-2">{new Date(order.date).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
};

export default DashboardAdmin;
