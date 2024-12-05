  import React, { useState, useEffect } from "react";
  import axios from "axios";
  import { FilePlus, Search, Trash2 } from "lucide-react"; // Import ikon Search dari Lucide
  import CrudButton from "../../Button/CrudButton";

  const OrderStock = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [newOrder, setNewOrder] = useState({
      noPembelian: "",
      date: "",
      kodebarang: "",
      barcode: "",
      namaBarang: "",
      hargaBeli: "",
      jumlahBeli: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
      fetchOrders();
    }, []);

    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/orders");
        const sortedOrders = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
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
          hargaBeli: parseInt(newOrder.hargaBeli, 10),
          jumlahBeli: parseInt(newOrder.jumlahBeli, 10),
        };

        if (isEditing) {
          await axios.patch(`http://localhost:5000/orders/${editId}`, payload, {
            headers: { "Content-Type": "application/json" },
          });
          setOrders(
            orders.map((order) =>
              order.id === editId ? { ...newOrder, id: editId } : order
            )
          );
          setIsEditing(false);
        } else {
          const response = await axios.post(
            "http://localhost:5000/orders",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          setOrders([...orders, { ...payload, id: response.data.id }]);
        }

        setNewOrder({
          noPembelian: "",
          date: "",
          kodebarang: "",
          barcode: "",
          namaBarang: "",
          hargaBeli: "",
          jumlahBeli: "",
        });
      } catch (error) {
        console.error("Error adding/updating order:", error);
      }
    };

    const handleEditOrder = (id) => {
      const orderToEdit = orders.find((order) => order.id === id);
      setNewOrder(orderToEdit);
      setEditId(id);
      setIsEditing(true);
    };

    const handleDeleteOrder = async (id) => {
        try {
          await axios.delete(`http://localhost:5000/orders/${id}`);
          setOrders(orders.filter((order) => order.id !== id));
        } catch (error) {
          console.error("Error deleting order:", error);
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
      <div className="container mx-auto p-5 mt-10 bg-white shadow-lg rounded-lg">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-semibold text-gray-800">Order Stok</h1>

          {/* Search Input */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              className="border-2 border-gray-300 p-3 pl-12 w-full rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Search Kode Barang / Nama Barang"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute top-3 left-3 text-gray-500" size={20} />
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleAddOrder} className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <input
              type="text"
              name="noPembelian"
              placeholder="No Pembelian"
              value={newOrder.noPembelian}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              name="date"
              value={newOrder.date}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="kodebarang"
              placeholder="Kode Barang"
              value={newOrder.kodebarang}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="barcode"
              placeholder="Barcode"
              value={newOrder.barcode}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="namaBarang"
              placeholder="Nama Barang"
              value={newOrder.namaBarang}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="hargaBeli"
              placeholder="Harga Beli"
              value={newOrder.hargaBeli}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="jumlahBeli"
              placeholder="Jumlah Beli"
              value={newOrder.jumlahBeli}
              onChange={handleInputChange}
              required
              className="border-2 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-3 rounded-md mt-4 hover:bg-blue-600 transition">
            {isEditing ? "Update Order" : "Tambah Order"}
          </button>
        </form>

        {/* Orders Table */}
        <table className="min-w-full bg-white shadow-md rounded-md">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="py-3 px-4">No Pembelian</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Kode Barang</th>
              <th className="py-3 px-4">Barcode</th>
              <th className="py-3 px-4">Nama Barang</th>
              <th className="py-3 px-4">Harga Beli</th>
              <th className="py-3 px-4">Jumlah Beli</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-100 transition">
                <td className="border px-4 py-3">{order.noPembelian}</td>
                <td className="border px-4 py-3">
                  {new Date(order.date).toLocaleDateString()}
                </td>
                <td className="border px-4 py-3">{order.kodebarang}</td>
                <td className="border px-4 py-3">{order.barcode}</td>
                <td className="border px-4 py-3">{order.namaBarang}</td>
                <td className="border px-4 py-3">{order.hargaBeli}</td>
                <td className="border px-4 py-3">{order.jumlahBeli}</td>
                <td className="border px-4 py-3 flex space-x-2">
                  <CrudButton
                    icon={FilePlus}
                    label="Edit"
                    onClick={() => handleEditOrder(order.id)}
                    actionType="edit"
                    buttonStyle="primary"
                  />
                  <CrudButton
                    icon={Trash2}
                    label="Delete"
                    onConfirm={() => handleDeleteOrder(order.id)}
                    confirmMessage="Apakah Anda yakin ingin menghapus Stok ini?"
                    title="Hapus Stok"
                    actionType="delete"
                    buttonStyle="danger"
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
