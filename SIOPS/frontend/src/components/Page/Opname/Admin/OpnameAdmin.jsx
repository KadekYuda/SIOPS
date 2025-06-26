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
import BatchStatus from "../../BatchStatus";

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

      const opnamesRes = await api.get("/opname/all");
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
            batches={batches}
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

const AllOpname = ({
  opnames,
  users,
  batches,
  fetchData,
  setError,
  setSuccess,
}) => {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.username,
  }));
  const [selectedOpname, setSelectedOpname] = useState(null);

  const groupedOpnames = opnames.reduce((acc, opname) => {
    const batch = batches.find((b) => b.batch_id === opname.batch_id);
    const date = opname.scheduled_date || opname.opname_date; // Gunakan opname_date untuk direct opname
    const key = `${date}-${opname.user_id || "admin"}`; // Gunakan "admin" untuk direct opname
    if (!acc[key]) {
      acc[key] = {
        date: date,
        user_id: opname.user_id,
        items: [],
        status: opname.status,
        user: users.find((u) => u.user_id === opname.user_id) || {
          username: "Admin",
        },
      };
    }
    acc[key].items.push(opname);
    if (opname.status === "adjusted") acc[key].status = "adjusted";
    else if (opname.status === "submitted" && acc[key].status !== "adjusted")
      acc[key].status = "submitted";
    else if (
      opname.status === "in_progress" &&
      acc[key].status !== "adjusted" &&
      acc[key].status !== "submitted"
    )
      acc[key].status = "in_progress";
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
              { value: "in_progress", label: "In Progress" },
              { value: "submitted", label: "Submitted" },
              { value: "adjusted", label: "Adjusted" },
            ].find((option) => option.value === filterStatus)}
            onChange={(option) => setFilterStatus(option?.value || "")}
            options={[
              { value: "scheduled", label: "Scheduled" },
              { value: "in_progress", label: "In Progress" },
              { value: "submitted", label: "Submitted" },
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
                            : opnameGroup.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : opnameGroup.status === "submitted"
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
                      : selectedOpname.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedOpname.status === "submitted"
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
                  {selectedOpname.items.map((item) => {
                    const difference =
                      (item.physical_stock || 0) - (item.system_stock || 0);
                    return (
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
                          {difference !== 0 ? difference : "-"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === "scheduled"
                                ? "bg-gray-100 text-gray-800"
                                : item.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

  const categoryOptions = categories.map((category) => ({
    value: category.code_categories,
    label: category.name_categories || `Category ${category.code_categories}`,
  }));

  useEffect(() => {
    if (!Array.isArray(batches) || batches.length === 0) {
      setProductList([]);
      setBatchSummary({ count: 0, categories: [] });
      return;
    }

    const productsFromBatches = batches
      .filter(
        (batch) =>
          (selectedCategories.length === 0 ||
            selectedCategories.includes(batch.product.code_categories)) &&
          (!searchProduct ||
            batch.product.name_product
              ?.toLowerCase()
              .includes(searchProduct.toLowerCase()) ||
            batch.product.code_product
              ?.toLowerCase()
              .includes(searchProduct.toLowerCase()))
      )
      .map((batch) => ({
        ...batch.product,
        batchCount: 1,
        totalStock: batch.stock_quantity || 0,
      }))
      .reduce((unique, item) => {
        if (!unique[item.code_product]) {
          unique[item.code_product] = item;
        }
        return unique;
      }, {});

    const filteredProducts = Object.values(productsFromBatches);
    setProductList(filteredProducts);

    const categoryCounts = filteredProducts.reduce((acc, product) => {
      const category = categories.find(
        (cat) => cat.code_categories === product.code_categories
      );
      const categoryName = category?.name_categories || "Unknown Category";
      if (!acc[categoryName])
        acc[categoryName] = { name: categoryName, count: 0 };
      acc[categoryName].count += 1;
      return acc;
    }, {});

    setBatchSummary({
      count: filteredProducts.length,
      categories: Object.values(categoryCounts),
    });
  }, [selectedCategories, batches, categories, searchProduct]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!scheduledDate) throw new Error("Please select a schedule date");
      if (selectedCategories.length === 0)
        throw new Error("Please select at least one product category");

      const products = batches
        .filter((batch) =>
          selectedCategories.includes(batch.product.code_categories)
        )
        .map((batch) => batch.product.code_product)
        .filter((value, index, self) => self.indexOf(value) === index);

      if (!selectedUserId) throw new Error("Pilih staff untuk penugasan");

      for (const code_product of products) {
        await api.post("/opname/create", {
          code_product,
          scheduled_date: scheduledDate,
          assigned_user_id: selectedUserId,
        });
      }

      setSuccess(
        `Penugasan opname untuk ${products.length} produk berhasil dibuat!`
      );
      setSelectedCategories([]);
      setSelectedUserId("");
      setScheduledDate("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal membuat penugasan");
    }
  };

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
              <strong>Total Products:</strong> {batchSummary.count}
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
                <tbody className="divide-y divide-gray-200">
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [physicalStock, setPhysicalStock] = useState("");
  const [expiredQuantity, setExpiredQuantity] = useState("");
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [showUpdateExpModal, setShowUpdateExpModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [newExpDate, setNewExpDate] = useState("");
  const [pendingInputs, setPendingInputs] = useState([]); // State untuk tabel sementara

  const handleUpdateExpDate = (batch) => {
    setSelectedBatch(batch);
    setNewExpDate(batch.expired_date || "");
    setShowUpdateExpModal(true);
  };

  const saveExpDate = async () => {
    try {
      await api.put(`/batch/stock/${selectedBatch.batch_id}`, {
        expired_date: newExpDate,
      });
      setSuccess("Expiration date updated successfully");
      fetchData();
      setShowUpdateExpModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update expiration date");
    }
  };

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((category) => ({
      value: category.code_categories,
      label: category.name_categories,
    })),
  ];

  const productOptions = useMemo(() => {
    return batches
      .filter(
        (batch) =>
          (!selectedCategory ||
            batch.product.code_categories === selectedCategory) &&
          (!batchSearch ||
            batch.product.name_product
              .toLowerCase()
              .includes(batchSearch.toLowerCase()) ||
            batch.product.code_product
              .toLowerCase()
              .includes(batchSearch.toLowerCase()))
      )
      .map((batch) => ({
        value: batch.product.code_product,
        label: batch.product.name_product,
      }))
      .filter(
        (value, index, self) =>
          self.findIndex((v) => v.value === value.value) === index
      );
  }, [batches, selectedCategory, batchSearch]);

  const handleSaveInput = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!selectedProduct) throw new Error("Pilih produk terlebih dahulu");
      if (!physicalStock || parseInt(physicalStock) < 0)
        throw new Error("Masukkan stok fisik yang valid");

      const currentDate = new Date().toISOString().split("T")[0];
      const newInput = {
        code_product: selectedProduct,
        physical_stock: parseInt(physicalStock),
        expired_stock: parseInt(expiredQuantity) || 0,
        damaged_stock: parseInt(damagedQuantity) || 0,
        notes,
        date: currentDate,
      };

      setPendingInputs([...pendingInputs, newInput]);
      setSuccess("Opname input saved pending!");
      setShowBatchModal(false);
      setSelectedProduct(null);
      setPhysicalStock("");
      setExpiredQuantity("");
      setDamagedQuantity("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan input opname");
    }
  };

  const handleConfirmOpname = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (pendingInputs.length === 0)
        throw new Error("No pending inputs to confirm");

      const currentDate = pendingInputs[0].date;
      await api.post("/opname/confirm", { opname_date: currentDate });

      setPendingInputs([]);
      setSuccess("Direct opname confirmed!");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengkonfirmasi opname");
    }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Category
          </label>
          <Select
            value={categoryOptions.find(
              (option) => option.value === selectedCategory
            )}
            onChange={(option) => {
              setSelectedCategory(option?.value || "");
              setSelectedProduct(null);
              setBatchSearch("");
            }}
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

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <div className="relative">
            <input
              type="text"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
          {batchSearch && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {productOptions.length > 0 ? (
                productOptions.map((product) => (
                  <button
                    key={product.value}
                    onClick={() => {
                      setSelectedProduct(product.value);
                      setBatchSearch("");
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{product.label}</span>
                    <span className="text-xs text-gray-500">
                      {product.value}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Product
          </label>
          <Select
            value={productOptions.find(
              (option) => option.value === selectedProduct
            )}
            onChange={(option) => setSelectedProduct(option?.value || null)}
            options={productOptions}
            placeholder="Select Product..."
            className="text-sm"
            isClearable
            isDisabled={batchSearch !== ""}
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

      {selectedProduct && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          <div className="bg-white px-4 py-3 border-b">
            <h3 className="font-medium text-gray-800">Product Details</h3>
          </div>
          <div className="divide-y">
            {batches
              .filter((batch) => batch.product.code_product === selectedProduct)
              .map((batch) => (
                <div key={batch.batch_id} className="bg-white p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Batch: {batch.batch_code}
                      </p>
                      <div className="flex space-x-3">
                        <BatchStatus
                          stockQuantity={batch.stock_quantity}
                          expDate={batch.expired_date}
                          batchId={batch.batch_id}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateExpDate(batch)}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      Update Exp. Date
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="bg-indigo-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-indigo-600 font-medium">
                  Total Batches:
                </span>
                <span className="ml-2 text-indigo-900">
                  {
                    batches.filter(
                      (b) => b.product.code_product === selectedProduct
                    ).length
                  }
                </span>
              </div>
              <div>
                <span className="text-indigo-600 font-medium">
                  Total Stock:
                </span>
                <span className="ml-2 text-indigo-900">
                  {batches
                    .filter((b) => b.product.code_product === selectedProduct)
                    .reduce((sum, b) => sum + b.stock_quantity, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (selectedProduct) setShowBatchModal(true);
          else setError("Pilih produk terlebih dahulu");
        }}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
      >
        Input Opname
      </button>

      {pendingInputs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Pending Inputs</h3>
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Physical Stock</th>
                <th className="px-4 py-2">Expired Stock</th>
                <th className="px-4 py-2">Damaged Stock</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInputs.map((input, index) => {
                const productName = batches.find(
                  (b) => b.product.code_product === input.code_product
                )?.product.name_product;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {productName || input.code_product}
                    </td>
                    <td className="px-4 py-2">{input.physical_stock}</td>
                    <td className="px-4 py-2">{input.expired_stock}</td>
                    <td className="px-4 py-2">{input.damaged_stock}</td>
                    <td className="px-4 py-2">{input.date}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          setPendingInputs(
                            pendingInputs.filter((_, i) => i !== index)
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={handleConfirmOpname}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            Confirm Direct Opname
          </button>
        </div>
      )}

      {showBatchModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Input Opname:{" "}
                {
                  batches.find(
                    (b) => b.product.code_product === selectedProduct
                  )?.product.name_product
                }
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveInput} className="p-6">
              <div className="mb-6 bg-indigo-50 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-3">
                  Current Stock Information
                </h4>
                <div className="space-y-3">
                  {batches
                    .filter(
                      (batch) => batch.product.code_product === selectedProduct
                    )
                    .map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="bg-white rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              Batch {batch.batch_code}
                            </p>
                            <div className="mt-1">
                              <BatchStatus
                                stockQuantity={batch.stock_quantity}
                                expDate={batch.expired_date}
                                batchId={batch.batch_id}
                              />
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-500">System Stock</p>
                            <p className="font-medium">
                              {batch.stock_quantity} units
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="bg-indigo-100 rounded-lg p-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-indigo-900">
                        Total System Stock:
                      </span>
                      <span className="text-sm font-bold text-indigo-900">
                        {batches
                          .filter(
                            (b) => b.product.code_product === selectedProduct
                          )
                          .reduce((sum, b) => sum + b.stock_quantity, 0)}{" "}
                        units
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Physical Stock Count*
                  </label>
                  <input
                    type="number"
                    value={physicalStock}
                    onChange={(e) => setPhysicalStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    required
                    min="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expired Stock
                    </label>
                    <input
                      type="number"
                      value={expiredQuantity}
                      onChange={(e) => setExpiredQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Damaged Stock
                    </label>
                    <input
                      type="number"
                      value={damagedQuantity}
                      onChange={(e) => setDamagedQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    rows="3"
                    placeholder="Add any additional notes about the stock count..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
                  Save Input
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Expiration Date Modal */}
      {showUpdateExpModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Update Expiration Date
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch {selectedBatch.batch_code}
                </label>
                <input
                  type="date"
                  value={newExpDate}
                  onChange={(e) => setNewExpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUpdateExpModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveExpDate}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
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

export default OpnameAdmin;
