import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FilePlus, Search, Trash2 } from 'lucide-react'; // Import ikon Search dari Lucide
import Trash from '../../Button/Trash';
import CosButton from '../../Button/CosButton';

const OrderStock = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrder, setNewOrder] = useState({
    noPembelian: '',
    date: '',
    kodebarang: '',
    barcode: '',
    namaBarang: '',
    hargaBeli: '',
    jumlahBeli: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/orders');
      const sortedOrders = response.data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Mengurutkan berdasarkan tanggal
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        noPembelian: newOrder.noPembelian,
        date: newOrder.date,
        kodebarang: newOrder.kodebarang,
        barcode: newOrder.barcode,
        namaBarang: newOrder.namaBarang,
        hargaBeli: parseInt(newOrder.hargaBeli, 10), // Memastikan hargaBeli adalah integer
        jumlahBeli: parseInt(newOrder.jumlahBeli, 10) // Memastikan jumlahBeli adalah integer
      };

      if (isEditing) {
        await axios.patch(`http://localhost:5000/orders/${editId}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        setOrders(orders.map(order => order.id === editId ? { ...newOrder, id: editId } : order));
        setIsEditing(false);
      } else {
        const response = await axios.post('http://localhost:5000/orders', payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        setOrders([...orders, { ...payload, id: response.data.id }]);
      }

      // Reset form setelah berhasil submit
      setNewOrder({
        noPembelian: '',
        date: '',
        kodebarang: '',
        barcode: '',
        namaBarang: '',
        hargaBeli: '',
        jumlahBeli: '',
      });
    } catch (error) {
      console.error('Error adding/updating order:', error);
      console.error('Error details:', error.response ? error.response.data : 'No error details');
    }
  };

  const handleEditOrder = (id) => {
    const orderToEdit = orders.find(order => order.id === id);
    setNewOrder(orderToEdit);
    setEditId(id);
    setIsEditing(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await axios.delete(`http://localhost:5000/orders/${id}`);
        setOrders(orders.filter(order => order.id !== id));
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({ ...newOrder, [name]: value });
  };

  const filteredOrders = orders.filter((order) => {
    return (
      order.kodebarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.namaBarang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="container mx-auto p-5 mt-20">
      {/* Flexbox untuk menempatkan judul dan kolom pencarian */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Order Stok</h1>
        
        {/* Kolom pencarian dengan ikon di dalam */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            className="border p-2 pl-10 w-full rounded-lg"
            placeholder="Search Kode Barang / Nama Barang"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Ikon pencarian */}
          <Search className="absolute top-3 left-3 text-gray-400" size={20} />
        </div>
      </div>

      <form onSubmit={handleAddOrder} className="mb-5">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="noPembelian"
            placeholder="No Pembelian"
            value={newOrder.noPembelian}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="date"
            name="date"
            placeholder="Date"
            value={newOrder.date}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="text"
            name="kodebarang"
            placeholder="Kode Barang"
            value={newOrder.kodebarang}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="text"
            name="barcode"
            placeholder="Barcode"
            value={newOrder.barcode}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="text"
            name="namaBarang"
            placeholder="Nama Barang"
            value={newOrder.namaBarang}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="number"
            name="hargaBeli"
            placeholder="Harga Beli"
            value={newOrder.hargaBeli}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
          <input
            type="text"
            name="jumlahBeli"
            placeholder="Jumlah Beli"
            value={newOrder.jumlahBeli}
            onChange={handleInputChange}
            required
            className="border p-2"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 mt-4">
          {isEditing ? 'Update Order' : 'Tambah Order'}
        </button>
      </form>

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">No Pembelian</th>
            <th className="py-2">Tanggal</th>
            <th className="py-2">Kode Barang</th>
            <th className="py-2">Barcode</th>
            <th className="py-2">Nama Barang</th>
            <th className="py-2">Harga Beli</th>
            <th className='py-2'>Jumlah Beli</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td className="border px-4 py-2">{order.noPembelian}</td>
              <td className="border px-4 py-2">{new Date(order.date).toLocaleDateString()}</td>
              <td className="border px-4 py-2">{order.kodebarang}</td>
              <td className="border px-4 py-2">{order.barcode}</td>
              <td className="border px-4 py-2">{order.namaBarang}</td>
              <td className="border px-4 py-2">{order.hargaBeli}</td>
              <td className="border px-4 py-2">{order.jumlahBeli}</td>
              <td className="border px-4 py-2">
              <CosButton 
  icon={FilePlus} 
  label="Edit" 
  onClick={() => handleEditOrder(order.id)} 
  actionType="edit" // Tidak ada modal konfirmasi untuk edit
  buttonStyle="btn btn-primary"
/>
<CosButton 
  icon={Trash2} 
  label="Delete" 
  onConfirm={() => handleDeleteOrder(order.id)} 
  confirmMessage="Apakah Anda yakin ingin menghapus Stok ini?" 
  title="Hapus Stok"
  actionType="delete" // Mengaktifkan modal konfirmasi hanya untuk delete
  buttonStyle="btn btn-danger" // Style khusus untuk tombol delete
/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderStock;
