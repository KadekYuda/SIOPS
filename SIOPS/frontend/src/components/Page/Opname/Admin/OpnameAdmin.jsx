import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Package,
  Calendar,
  ClipboardEdit,
  FileText,
  Search,
  X,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Select from "react-select";
import api from "../../../../service/api";
import Pagination from "../../Product/Pagination";
import AlertModal from "../../../modal/AlertModal";
import SuccessModal from "../../../modal/SuccessModal";

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

const OpnameAdmin = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [opnames, setOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await api.get("/users");
      // Make sure to include all staff users, even if they don't have a username set
      const staffUsers = Array.isArray(usersRes.data)
        ? usersRes.data
            .filter((user) => user.role === "staff")
            .map((user) => ({
              ...user,
              username: user.name || user.username || `Staff ${user.user_id}`,
              user_id: user.user_id,
            }))
        : [];
      setUsers(staffUsers);

      const batchesRes = await api.get("/batch/stock");
      const batchData = batchesRes.data?.result || [];
      setBatches(batchData);

      const opnamesRes = await api.get("/opname");
      console.log("Raw Opname Response:", opnamesRes.data);

      // Transform opname data to include user and batch details
      const transformedOpnames = Array.isArray(opnamesRes.data)
        ? opnamesRes.data.map((opname) => {
            const user = staffUsers.find((u) => u.user_id === opname.user_id);
            const batch = batchData.find((b) => b.batch_id === opname.batch_id);

            return {
              ...opname,
              User: user || { username: `Staff ${opname.user_id}` },
              batchStock: {
                ...batch,
                product: batch?.product || {
                  name_product: `Batch ${opname.batch_id}`,
                },
              },
            };
          })
        : [];

      console.log("Transformed Opnames:", transformedOpnames);
      setOpnames(transformedOpnames);

      let categoriesData = [];
      try {
        const categoriesRes = await api.get("/categories");
        categoriesData = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.result || [];
      } catch (catErr) {
        try {
          const altCategoriesRes = await api.get("/products/categories");
          categoriesData = Array.isArray(altCategoriesRes.data)
            ? altCategoriesRes.data
            : altCategoriesRes.data?.result || [];
        } catch (altErr) {
          categoriesData = [
            { code_categories: "cat1", name_categories: "Obat" },
            { code_categories: "cat2", name_categories: "Vitamin" },
            { code_categories: "cat3", name_categories: "Suplemen" },
          ];
        }
      }
      setCategories(categoriesData);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="px-4">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-t-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center">
            <Package className="text-white mr-3" size={36} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Opname Management
              </h1>
              <p className="text-indigo-100 text-sm">
                Manage assignments and direct opname input
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Tab
              label="Schedule Opname"
              icon={Calendar}
              isActive={activeTab === "schedule"}
              onClick={() => setActiveTab("schedule")}
            />
            <Tab
              label="Direct Opname"
              icon={ClipboardEdit}
              isActive={activeTab === "direct"}
              onClick={() => setActiveTab("direct")}
            />
          </div>
        </div>
        <div className="mb-8">
          {activeTab === "schedule" && (
            <ScheduleOpname
              users={users}
              batches={batches}
              categories={categories}
              fetchData={fetchData}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
          {activeTab === "direct" && (
            <DirectOpname
              batches={batches}
              categories={categories}
              fetchData={fetchData}
              setSuccess={setSuccess}
              setError={setError}
            />
          )}
        </div>
        <div className="bg-white rounded-b-xl shadow-md border border-gray-100 border-t-0">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 sm:px-6 py-4 sm:py-6 border-b rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-white mr-2 sm:mr-3" size={30} />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Opname List
                  </h2>
                  <p className="text-sm text-gray-200">
                    View and manage your opname transactions
                  </p>
                </div>
              </div>
            </div>
          </div>
          <AllOpname
            opnames={opnames}
            users={users}
            fetchData={fetchData}
            setError={setError}
            setSuccess={setSuccess}
          />
        </div>
        <AlertModal isOpen={!!error} message={error} onClose={clearError} />
        <SuccessModal
          isOpen={!!success}
          message={success}
          onClose={clearSuccess}
        />
      </div>
    </div>
  );
};

const AllOpname = ({ opnames, users, fetchData, setError, setSuccess }) => {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.username,
  }));
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Group opnames by scheduled_date and user_id
  const groupedOpnames = opnames.reduce((acc, opname) => {
    const key = `${opname.scheduled_date}-${opname.user_id}`;
    if (!acc[key]) {
      acc[key] = {
        date: opname.scheduled_date,
        user_id: opname.user_id,
        items: [],
        status: opname.status,
        user: users.find((u) => u.user_id === opname.user_id),
      };
    }
    acc[key].items.push(opname);
    // Update group status based on items
    if (opname.status === "adjusted") {
      acc[key].status = "adjusted";
    } else if (opname.status === "reviewed" && acc[key].status !== "adjusted") {
      acc[key].status = "reviewed";
    } else if (
      opname.status === "submitted" &&
      acc[key].status !== "adjusted" &&
      acc[key].status !== "reviewed"
    ) {
      acc[key].status = "submitted";
    }
    return acc;
  }, {});

  const opnameList = Object.values(groupedOpnames);

  const filteredOpnames = opnameList.filter(
    (opnameGroup) =>
      opnameGroup.user?.username
        ?.toLowerCase()
        .includes(search.toLowerCase()) &&
      (!filterDate || opnameGroup.date === filterDate) &&
      (!filterStatus || opnameGroup.status === filterStatus) &&
      (!filterUser || opnameGroup.user_id === filterUser)
  );

  const getCurrentPageItems = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOpnames.slice(start, end);
  };

  const handleReview = async (action, items) => {
    try {
      if (!items?.length) throw new Error("No items to review");
      const status = action === "adjust" ? "adjusted" : "reviewed";

      // Review all items in the group
      await Promise.all(
        items.map((item) =>
          api.post("/opname/review", {
            opname_id: item.opname_id,
            status,
            adjust_stock: action === "adjust",
          })
        )
      );

      setSuccess(
        action === "adjust" ? "Opnames adjusted!" : "Opnames reviewed!"
      );
      setSelectedOpname(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to review opname");
    }
  };

  return (
    <div className="p-3 sm:p-4">
      {/* Search and filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by staff or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <Select
            value={[
              { value: "scheduled", label: "Scheduled" },
              { value: "submitted", label: "Submitted" },
              { value: "reviewed", label: "Reviewed" },
              { value: "adjusted", label: "Adjusted" },
            ].find((option) => option.value === filterStatus)}
            onChange={(option) => setFilterStatus(option?.value || "")}
            options={[
              { value: "scheduled", label: "Scheduled" },
              { value: "submitted", label: "Submitted" },
              { value: "reviewed", label: "Reviewed" },
              { value: "adjusted", label: "Adjusted" },
            ]}
            placeholder="Filter Status..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
        <div>
          <Select
            value={userOptions.find((option) => option.value === filterUser)}
            onChange={(option) => setFilterUser(option?.value || "")}
            options={userOptions}
            placeholder="Filter User..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
      </div>

      {filteredOpnames.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">
            No opname found
          </h3>
          <p className="text-gray-400 text-sm">
            There are no recorded opnames yet
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-indigo-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">
                    Total Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getCurrentPageItems().map((opnameGroup, index) => (
                  <tr
                    key={`${opnameGroup.date}-${opnameGroup.user_id}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-indigo-600 font-medium">
                      #{index + 1 + currentPage * itemsPerPage}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {opnameGroup.user?.username || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {opnameGroup.date}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          opnameGroup.status === "scheduled"
                            ? "bg-gray-100 text-gray-800"
                            : opnameGroup.status === "submitted"
                            ? "bg-yellow-100 text-yellow-800"
                            : opnameGroup.status === "reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {opnameGroup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {opnameGroup.items.length} items
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOpname(opnameGroup)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 flex items-center ml-auto"
                      >
                        <Eye size={14} className="mr-1.5" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredOpnames.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOpnames.length}
            />
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedOpname && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Opname Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedOpname.date} - {selectedOpname.user?.username}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                    selectedOpname.status === "scheduled"
                      ? "bg-gray-100 text-gray-800"
                      : selectedOpname.status === "submitted"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedOpname.status === "reviewed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedOpname.status}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      System Stock
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Physical Stock
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Difference
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOpname.items.map((item) => (
                    <tr key={item.opname_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.batchStock?.product?.name_product}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.system_stock}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.physical_stock || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {item.difference || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === "scheduled"
                              ? "bg-gray-100 text-gray-800"
                              : item.status === "submitted"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOpname(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
              {selectedOpname.status === "submitted" && (
                <>
                  <button
                    onClick={() => handleReview("review", selectedOpname.items)}
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleReview("adjust", selectedOpname.items)}
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                  >
                    Adjust Stock
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduleOpname = ({
  users,
  batches,
  categories,
  fetchData,
  setSuccess,
  setError,
}) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [batchSummary, setBatchSummary] = useState({
    count: 0,
    categories: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [productList, setProductList] = useState([]);

  const userOptions = users.map((user) => ({
    value: String(user.user_id),
    label: user.username,
  }));

  const categoryOptions = [
    ...(Array.isArray(categories) && categories.length > 0
      ? categories.map((category) => ({
          value: category.code_categories,
          label:
            category.name_categories || `Category ${category.code_categories}`,
        }))
      : []),
  ];

  useEffect(() => {
    if (!Array.isArray(batches) || batches.length === 0) {
      setProductList([]);
      setBatchSummary({ count: 0, categories: [] });
      return;
    }

    try {
      const productsFromBatches = batches
        .filter((batch) => {
          const isValid =
            batch?.product &&
            batch.product.code_product &&
            batch.product.code_categories;
          const matchesSearch =
            !searchProduct ||
            (batch.product.name_product &&
              batch.product.name_product
                .toLowerCase()
                .includes(searchProduct.toLowerCase())) ||
            (batch.product.code_product &&
              batch.product.code_product
                .toLowerCase()
                .includes(searchProduct.toLowerCase()));
          return (
            isValid &&
            (selectedCategories.length === 0 ||
              selectedCategories.includes(batch.product.code_categories)) &&
            matchesSearch
          );
        })
        .map((batch) => ({
          ...batch.product,
          batchCount: 1,
          totalStock: batch.stock_quantity || 0,
          batch_id: batch.batch_id,
        }));

      const productMap = productsFromBatches.reduce((map, product) => {
        if (!map.has(product.code_product)) {
          map.set(product.code_product, {
            ...product,
            batchCount: 1,
            totalStock: product.totalStock || 0,
          });
        } else {
          const existing = map.get(product.code_product);
          existing.batchCount += 1;
          existing.totalStock += product.totalStock || 0;
        }
        return map;
      }, new Map());

      const filteredProducts = Array.from(productMap.values());
      setProductList(filteredProducts);

      const categoryCounts = filteredProducts.reduce((acc, product) => {
        const category = categories.find(
          (cat) => cat.code_categories === product.code_categories
        );
        const categoryName = category?.name_categories || "Unknown Category";

        if (!acc[categoryName]) {
          acc[categoryName] = { name: categoryName, count: 0 };
        }
        acc[categoryName].count += product.batchCount;
        return acc;
      }, {});

      setBatchSummary({
        count: filteredProducts.reduce((sum, p) => sum + p.batchCount, 0),
        categories: Object.values(categoryCounts),
      });
    } catch (error) {
      console.error("Error filtering products:", error);
      setProductList([]);
      setBatchSummary({ count: 0, categories: [] });
    }
  }, [selectedCategories, batches, categories, searchProduct]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!scheduledDate) throw new Error("Please select a schedule date");
      if (selectedCategories.length === 0)
        throw new Error("Please select at least one product category");

      const batchIds = batches
        .filter((batch) => {
          if (!batch.product || !batch.product.code_categories) return false;
          return selectedCategories.includes(batch.product.code_categories);
        })
        .map((batch) => String(batch.batch_id));

      if (!selectedUserId) {
        throw new Error("Pilih staff untuk penugasan");
      }

      if (batchIds.length === 0) {
        throw new Error(
          "Tidak ada batch yang tersedia untuk kategori yang dipilih"
        );
      }

      const requestData = {
        batch_ids: batchIds,
        assigned_user_id: String(selectedUserId),
        scheduled_date: scheduledDate,
        status: "scheduled",
      };

      await api.post("/opname/create", requestData);
      setSuccess(
        `Penugasan opname untuk ${batchIds.length} batch berhasil dibuat!`
      );
      setSelectedCategories([]);
      setSelectedUserId("");
      setScheduledDate("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuat penugasan");
    }
  };

  // Filter kategori berdasarkan pencarian
  const filteredCategories = batchSummary.categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  return (
    <div className="bg-white rounded-none shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <Calendar className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Schedule Opname
          </h2>
          <p className="text-sm text-gray-500">
            Create a new opname assignment
          </p>
        </div>
      </div>
      <form onSubmit={handleCreateTask} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Categories
            </label>
            <Select
              isMulti
              value={categoryOptions.filter((option) =>
                selectedCategories.includes(option.value)
              )}
              onChange={(options) =>
                setSelectedCategories(
                  options ? options.map((opt) => opt.value) : []
                )
              }
              options={categoryOptions}
              placeholder="Select Categories..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  "&:hover": { borderColor: "#9ca3af" },
                  boxShadow: "none",
                  "&:focus": {
                    borderColor: "#4f46e5",
                    boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                  },
                }),
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Staff (Required)
            </label>
            <Select
              value={userOptions.find(
                (option) => option.value === selectedUserId
              )}
              onChange={(option) => setSelectedUserId(option?.value || "")}
              options={userOptions}
              placeholder="Pilih Staff..."
              className="text-sm"
              isClearable
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  "&:hover": { borderColor: "#9ca3af" },
                  boxShadow: "none",
                  "&:focus": {
                    borderColor: "#4f46e5",
                    boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                  },
                }),
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                required
              />
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <h4 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-1">
            <Package className="text-indigo-500" size={16} />
            Batch Summary
          </h4>
          <div className="space-y-2 text-sm text-indigo-800">
            <div>
              <strong>Total Batches:</strong> {batchSummary.count}
            </div>
            {batchSummary.categories.length > 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
              >
                <span>View Category Details</span>
                <Eye size={16} />
              </button>
            )}
          </div>
        </div>
        {productList.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                Product List ({productList.length}):
              </h4>
              <div className="relative w-1/3">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by code or product..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productList.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {product.code_product || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {product.name_product || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {categories.find(
                          (cat) =>
                            cat.code_categories === product.code_categories
                        )?.name_categories || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center text-sm"
          >
            <Check className="mr-2" size={14} />
            Confirm Assignment
          </button>
        </div>
      </form>

      {/* Modal for Category Details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Category Details
              </h3>
              <div className="relative mt-2">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search category..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="p-6 max-h-[calc(100vh-20rem)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Batch Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((cat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {cat.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {cat.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCategories.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No categories found.
                </p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ScheduleOpname.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      username: PropTypes.string.isRequired,
      name: PropTypes.string,
    })
  ).isRequired,
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      stock_quantity: PropTypes.number,
      product: PropTypes.shape({
        code_product: PropTypes.string.isRequired,
        name_product: PropTypes.string.isRequired,
        code_categories: PropTypes.string,
      }),
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ).isRequired,
  fetchData: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

const DirectOpname = ({
  batches,
  categories,
  fetchData,
  setSuccess,
  setError,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredQuantity, setExpiredQuantity] = useState("");
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredBatches, setFilteredBatches] = useState([]);

  const itemsPerPageOptions = [
    { value: 5, label: "5 items" },
    { value: 10, label: "10 items" },
    { value: 25, label: "25 items" },
    { value: 50, label: "50 items" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...(Array.isArray(categories)
      ? categories.map((category) => ({
          value: category.code_categories,
          label:
            category.name_categories || `Category ${category.code_categories}`,
        }))
      : []),
  ];

  useEffect(() => {
    try {
      const filtered = batches.filter((batch) => {
        if (!batch?.product?.name_product) return false;

        const matchesSearch =
          !batchSearch ||
          batch.product.name_product
            .toLowerCase()
            .includes(batchSearch.toLowerCase()) ||
          batch.batch_code.toLowerCase().includes(batchSearch.toLowerCase());

        if (!matchesSearch) return false;

        if (
          selectedCategory &&
          batch.product.code_categories !== selectedCategory
        ) {
          return false;
        }

        return true;
      });

      setFilteredBatches(filtered);
    } catch (error) {
      console.error("Error filtering batches:", error);
      setFilteredBatches([]);
    }
  }, [batches, selectedCategory, batchSearch]);

  const getCurrentPageItems = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBatches.slice(start, end);
  };

  const handleSubmitOpname = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!selectedBatchId) throw new Error("Pilih batch terlebih dahulu");
      if (!physicalStock) throw new Error("Masukkan jumlah stok fisik");
      await api.post("/opname/create", {
        batch_ids: [selectedBatchId],
        physical_stock: parseInt(physicalStock),
        expired_quantity: parseInt(expiredQuantity) || 0,
        damaged_quantity: parseInt(damagedQuantity) || 0,
        notes,
        status: "completed",
      });
      setSuccess("Data opname berhasil disimpan!");
      setShowBatchModal(false);
      setSelectedBatchId(null);
      setPhysicalStock("");
      setExpiredQuantity("");
      setDamagedQuantity("");
      setNotes("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan data opname");
    }
  };

  const selectedBatch = batches.find(
    (batch) => batch.batch_id === selectedBatchId
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory, batchSearch, itemsPerPage]);

  return (
    <div className="bg-white rounded-none shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <ClipboardEdit className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Direct Opname</h2>
          <p className="text-sm text-gray-500">Input opname data directly</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Category
          </label>
          <Select
            value={categoryOptions.find(
              (option) => option.value === selectedCategory
            )}
            onChange={(option) => setSelectedCategory(option?.value || "")}
            options={categoryOptions}
            placeholder="Select Category..."
            className="text-sm"
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Batch
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search product or batch..."
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Items per page
          </label>
          <Select
            value={itemsPerPageOptions.find(
              (option) => option.value === itemsPerPage
            )}
            onChange={(option) => {
              setItemsPerPage(option?.value || 10);
            }}
            options={itemsPerPageOptions}
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: "#d1d5db",
                "&:hover": { borderColor: "#9ca3af" },
                boxShadow: "none",
                "&:focus": {
                  borderColor: "#4f46e5",
                  boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.5)",
                },
              }),
            }}
          />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No batches available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Batch
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    System Stock
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getCurrentPageItems().map((batch) => (
                  <tr
                    key={batch.batch_id}
                    className={`hover:bg-gray-50 ${
                      selectedBatchId === batch.batch_id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {batch.product.name_product}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {categories.find(
                        (cat) =>
                          cat.code_categories === batch.product.code_categories
                      )?.name_categories || "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {batch.batch_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {batch.stock_quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => {
                          setSelectedBatchId(batch.batch_id);
                          setPhysicalStock("");
                          setExpiredQuantity("");
                          setDamagedQuantity("");
                          setNotes("");
                          setShowBatchModal(true);
                        }}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                      >
                        <ClipboardEdit size={12} className="inline mr-1" />
                        Input Opname
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredBatches.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredBatches.length}
        />
      </div>

      {showBatchModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Input Opname: {selectedBatch.product?.name_product}
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitOpname} className="p-6 space-y-4">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <h5 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-1">
                  <Package className="text-indigo-500" size={16} />
                  Batch Information
                </h5>
                <p className="text-sm text-indigo-800">
                  Batch: {selectedBatch.batch_code}
                </p>
                <p className="text-sm text-indigo-800">
                  System Stock: {selectedBatch.stock_quantity}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Stock
                </label>
                <input
                  type="number"
                  value={physicalStock}
                  onChange={(e) => setPhysicalStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expired Quantity
                </label>
                <input
                  type="number"
                  value={expiredQuantity}
                  onChange={(e) => setExpiredQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Damaged Quantity
                </label>
                <input
                  type="number"
                  value={damagedQuantity}
                  onChange={(e) => setDamagedQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  rows="3"
                  placeholder="Enter notes if needed..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                >
                  Save Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

DirectOpname.propTypes = {
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      batch_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      batch_code: PropTypes.string.isRequired,
      stock_quantity: PropTypes.number,
      product: PropTypes.shape({
        code_product: PropTypes.string.isRequired,
        name_product: PropTypes.string.isRequired,
        code_categories: PropTypes.string,
      }),
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      code_categories: PropTypes.string.isRequired,
      name_categories: PropTypes.string.isRequired,
    })
  ).isRequired,
  fetchData: PropTypes.func.isRequired,
  setSuccess: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
};

Tab.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default OpnameAdmin;
