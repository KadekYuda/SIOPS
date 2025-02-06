import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Product = () => {
  const [products, setProducts] = useState([]); // Initialize with empty array
  const [categories, setCategories] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [formData, setFormData] = useState({
    kdbar: '',
    barcode: '',
    nmbar: '',
    kdkel: '',
    hjual: '',
    markup: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    kdkel: '',
    nmkel: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const navigate = useNavigate();

  // Fetch products with search and pagination
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/products?${new URLSearchParams({
        search,
        page,
        limit,
        kdkel: selectedCategory
      }).toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(Array.isArray(response.data) ? response.data : []); // Ensure we always have an array
      setTotalPages(1); // Since pagination is not implemented in backend yet
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Set empty array on error
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.result || []); // Ensure we always have an array
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, page, limit, selectedCategory]);

  // Handle product form submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.patch(`http://localhost:5000/products/${editingProduct.kdbar}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setFormData({
        kdbar: '',
        barcode: '',
        nmbar: '',
        kdkel: '',
        hjual: '',
        markup: ''
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error submitting product:', error);
      alert(error.response?.data?.message || 'Error submitting product');
    }
  };

  // Handle category form submission
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/categories', categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.patch(`http://localhost:5000/categories/${editingCategory.kdkel}`, categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCategoryModal(false);
      setCategoryForm({ kdkel: '', nmkel: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error submitting category:', error);
      alert(error.response?.data?.message || 'Error submitting category');
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (kdbar) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/products/${kdbar}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.response?.data?.message || 'Error deleting product');
      }
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (kdkel) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/categories/${kdkel}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || 'Error deleting category');
      }
    }
  };

  const handleImportProducts = async (e) => {
    e.preventDefault();
    if (!importFile) {
        setImportError('Please select a file to upload');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', importFile);

        const response = await axios.post('http://localhost:5000/products/import', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        setImportStatus(`Successfully imported ${response.data.importedRecords} products`);
        setImportError('');
        setImportFile(null);
        fetchProducts(); // Refresh product list
    } catch (error) {
        console.error('Error importing products:', error);
        setImportError(error.response?.data?.msg || 'Error importing products');
        if (error.response?.data?.details) {
            setImportError(prev => prev + ': ' + error.response.data.details.join(', '));
        }
    }
};

  // Handle category selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(0); // Reset to first page when changing category
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px] max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.kdkel} value={cat.kdkel}>{cat.nmkel}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setModalMode('add');
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} /> Add Product
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Upload size={20} /> Import CSV
          </button>
          
          <button
            onClick={() => {
              setModalMode('add');
              setShowCategoryModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={20} /> Add Category
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Markup</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.kdbar} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.kdbar}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.barcode || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.nmbar}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.kdkel === product.kdkel)?.nmkel || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {Number(product.hjual).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.markup}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          kdbar: product.kdbar,
                          barcode: product.barcode || '',
                          nmbar: product.nmbar,
                          kdkel: product.kdkel || '',
                          hjual: product.hjual,
                          markup: product.markup
                        });
                        setModalMode('edit');
                        setShowModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.kdbar)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1 rounded ${page === i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                  <input
                    type="text"
                    value={formData.kdbar}
                    onChange={(e) => setFormData({ ...formData, kdbar: e.target.value })}
                    disabled={modalMode === 'edit'}
                    required
                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.nmbar}
                    onChange={(e) => setFormData({ ...formData, nmbar: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.kdkel}
                    onChange={(e) => setFormData({ ...formData, kdkel: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.kdkel} value={cat.kdkel}>{cat.nmkel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.hjual}
                    onChange={(e) => setFormData({ ...formData, hjual: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
                  <input
                    type="number"
                    value={formData.markup}
                    onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                    min="0"
                    step="0.00001"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Code</label>
                  <input
                    type="text"
                    value={categoryForm.kdkel}
                    onChange={(e) => setCategoryForm({ ...categoryForm, kdkel: e.target.value })}
                    disabled={modalMode === 'edit'}
                    required
                    maxLength={4}
                    className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.nmkel}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nmkel: e.target.value })}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {modalMode === 'add' ? 'Add Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Import Products</h2>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportStatus('');
                  setImportError('');
                  setImportFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleImportProducts}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  File must be a CSV with headers: kdbar, barcode, nmbar, kdkel, hjual, markup
                </p>
              </div>
              
              {importStatus && (
                <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                  {importStatus}
                </div>
              )}
              
              {importError && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportStatus('');
                    setImportError('');
                    setImportFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;