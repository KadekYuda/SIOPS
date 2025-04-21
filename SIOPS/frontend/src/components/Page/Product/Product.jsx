import React, { useState, useEffect, useCallback, useRef} from "react";
import { Plus, Edit2, Trash2, Search, X, Upload, Package } from "lucide-react";
import ProductModal from "../../modal/ProductModal";
import SuccessModal from "../../modal/SuccessModal";
import AlertModal from "../../modal/AlertModal";
import Categories from "./Categories";
import CrudButton from "../../Button/CrudButton";
import Pagination from "./Pagination";
import api from "../../../service/api";


const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    code_product: "",
    barcode: "",
    name_product: "",
    code_categories: "",
    sell_price: "",
    min_stock: "",
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    product: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);
  
  const validateForm = () => {
    const errors = {};
    if (!formData.code_product)
      errors.code_product = "Product code is required";
    if (!formData.name_product)
      errors.name_product = "Product name is required";
    if (!formData.sell_price) errors.sell_price = "Selling price is required";
    if (!formData.min_stock) errors.min_stock = "Minimum stock is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.get(
        `/products?${new URLSearchParams({
          search: search,
          page,
          limit,
        })}`
      );

      setProducts(response.data.result || []);
      setTotalPages(Math.ceil(response.data.totalRows / limit));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to fetch products",
      });
      setLoading(false);
    }
  }, [search, page, limit]);

  // Wrap fetchCategories with useCallback
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      
      if (response.data && response.data.result) {
        setCategories(response.data.result);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setAlertModal({
        isOpen: true,
        message: error.message || "Failed to fetch categories",
      });
      setCategories([]);
    }
  }, []);

  const handleCategoriesChange = (newCategories) => {
    setCategories(newCategories);
  };

  // Update useEffect to include dependencies
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmitProduct = async (productData) => {
    try {
      if (modalMode === "add") {
        await api.post("/products", productData);
        setSuccessModal({
          isOpen: true,
          message: "Product added successfully",
        });
      } else {
        await api.put(
          `/products/${productData.code_product}`,
          productData
        );
        setSuccessModal({
          isOpen: true,
          message: "Product updated successfully",
        });
      }

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to save product",
      });
    }
  };
  
  // Persiapkan initialData setiap kali akan edit produk
  const prepareEditData = (product) => {
    return {
      ...product,
      category_name: categories.find(c => c.code_categories === product.code_categories)?.name_categories || ""
    };
  };

  const handleDelete = async (code_product) => {
    try {
      await api.delete(`/products/${code_product}`);
      setSuccessModal({
        isOpen: true,
        message: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to delete product",
      });
    }
    setDeleteConfirmModal({ isOpen: false, product: null });
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setAlertModal({ isOpen: true, message: "Please select a CSV file" });
      return;
    }

    // Check if file is CSV
    if (!csvFile.name.endsWith(".csv")) {
      setAlertModal({ isOpen: true, message: "Only CSV files are allowed" });
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await api.post(
        "/products/import",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadLoading(false);
      setShowUploadModal(false);
      setCsvFile(null);
      setSuccessModal({
        isOpen: true,
        message: response.data.message || "Products imported successfully",
      });
      fetchProducts();
    } catch (error) {
      setUploadLoading(false);
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Failed to import products",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code_product: "",
      barcode: "",
      name_product: "",
      code_categories: "",
      sell_price: "",
      min_stock: "",
    });
    setFormErrors({});
  };

  const formatLargeNumber = (number) => {
    if (!number) return "";

    // Convert to string and remove any scientific notation
    const str = String(number);
    if (str.includes("E+")) {
      const [mantissa, exponent] = str.split("E+");
      const decimalPoints = mantissa.includes(".")
        ? mantissa.split(".")[1].length
        : 0;
      const num = parseFloat(mantissa);
      const exp = parseInt(exponent);

      // Convert to full number string
      let result = num.toString().replace(".", "");
      const zerosToAdd = exp - decimalPoints;
      result += "0".repeat(Math.max(0, zerosToAdd));

      return result;
    }

    return str;
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      {/* Header and Search Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Product Management
          </h1>
          <div className="flex gap-2">
            <CrudButton
              icon={Upload}
              label="Import CSV"
              onClick={() => setShowUploadModal(true)}
              buttonStyle="secondary"
              className="flex items-center gap-2"
            />
            <CrudButton
              icon={Plus}
              label="Add Product"
              onClick={() => {
                setModalMode("add");
                setShowModal(true);
                resetForm();
              }}
              buttonStyle="primary"
              className="flex items-center gap-2"
            />
          </div>
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
            <Categories onCategoriesChange={handleCategoriesChange} />
          </div>
        </div>

        <div className="flex md:hidden justify-end mb-4">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
  {(() => {
    if (loading) {
      return (
        <tr>
          <td colSpan="8" className="px-4 py-4 text-center">
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Loading...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (products.length === 0) {
      return (
        <tr>
          <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
            No products found
          </td>
        </tr>
      );
    }

    return products.map((product, index) => (
      <tr key={product.code_product} className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
          {index + 1 + page * limit}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {formatLargeNumber(product.code_product)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatLargeNumber(product.barcode) || "-"}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
          {product.name_product}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
          {categories.find(
            (c) => c.code_categories === product.code_categories
          )?.name_categories || "-"}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
          Rp {Number(product.sell_price).toLocaleString()}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
          {product.min_stock}
        </td>
        <td className="px-4 py-4 text-right text-sm font-medium">
          <div className="flex justify-end gap-3">
            <CrudButton
              icon={Edit2}
              onClick={() => {
                setFormData(product);
                setModalMode("edit");
                setShowModal(true);
              }}
              actionType="edit"
              buttonStyle="primary"
              className="p-1 rounded-full"
              buttonType="product"
            />
            <CrudButton
              icon={Trash2}
              onConfirm={() => handleDelete(product.code_product)}
              actionType="delete"
              buttonStyle="danger"
              className="p-1 rounded-full"
              title="Delete Product"
              confirmMessage={
                <>
                  Are you sure you want to delete product{" "}
                  <b className="text-gray-700">{product.name_product}</b>?
                </>
              }
              buttonType="product"
            />
          </div>
        </td>
      </tr>
    ));
  })()}
</tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="hidden md:flex">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0);
            }}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        onSubmit={handleSubmitProduct}
        modalMode={modalMode}
        initialData={modalMode === "add" ? {} : prepareEditData(formData)}
        categories={categories}
      />

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                Import Products from CSV
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setCsvFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="selectCsvFile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border rounded"
                />
                <p className="mt-2 text-sm text-gray-500">
                  File should be in CSV format with headers: code_product,
                  barcode, name_product, code_categories, sell_price, min_stock
                </p>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={uploadLoading || !csvFile}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 ${
                    uploadLoading || !csvFile
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-700"
                  }`}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        message={successModal.message}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
      />
    </div>
  );
};

export default Product;