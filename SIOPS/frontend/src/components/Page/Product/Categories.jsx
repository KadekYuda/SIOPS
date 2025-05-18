import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import AlertModal from "../../modal/AlertModal";
import SuccessModal from "../../modal/SuccessModal";
import CrudButton from "../../Button/CrudButton";
import api from "../../../service/api";

const Categories = ({ onCategoriesChange }) => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      const categoriesData = response.data.result;
      setCategories(categoriesData);
      // Only call onCategoriesChange if the categories have actually changed
      if (
        onCategoriesChange &&
        JSON.stringify(categoriesData) !== JSON.stringify(categories)
      ) {
        onCategoriesChange(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  }, [onCategoriesChange, categories]); // Add categories to dependency array

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length > 4) {
      setAlertModal({
        isOpen: true,
        message: "Category code cannot be more than 4 characters",
      });
      return;
    }

    try {
      if (editing) {
        await api.put(`/categories/${code}`, {
          name_categories: name,
        });
        setSuccessModal({
          isOpen: true,
          message: "Category updated successfully!",
        });
      } else {
        await api.post("/categories", {
          code_categories: code,
          name_categories: name,
        });
        setSuccessModal({
          isOpen: true,
          message: "Category added successfully!",
        });
      }
      setEditing(false);
      setCode("");
      setName("");
      setIsModalOpen(false);
      await fetchCategories();
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Error saving category",
      });
    }
  };

  const handleEdit = (categories) => {
    setCode(categories.code_categories);
    setName(categories.name_categories);
    setEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (code) => {
    try {
      await api.delete(`/categories/${code}`);
      await fetchCategories();

      setSuccessModal({
        isOpen: true,
        message: "Category deleted successfully!",
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || "Error deleting category",
      });
    }
  };

  return (
    <div className="h-full">
      <CrudButton
        icon={Plus}
        label="Create Category"
        onClick={() => {
          setEditing(false);
          setCode("");
          setName("");
          setIsModalOpen(true);
        }}
        buttonStyle="secondary"
        className="w-full h-full"
      />

      {/* Modal Categories */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="flex flex-col md:flex-row gap-4 max-h-[90vh] overflow-y-auto w-full max-w-4xl mx-4">
            {/* Form Modal */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg w-full md:w-[480px]"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editing ? "Edit Category" : "Add New Category"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Code
                    </label>
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 4) {
                          setCode(value);
                        }
                      }}
                      maxLength={4}
                      disabled={editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200"
                  >
                    {editing ? "Update Category" : "Add Category"}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Table Modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden w-full md:w-[480px]"
            >
              {/* Container scroll */}
              <div className="max-h-[250px] md:max-h-[400px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/4">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr
                        key={category.code_categories}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.code_categories}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.name_categories}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          <div className="flex justify-end gap-3">
                            <CrudButton
                              icon={Pencil}
                              onClick={() => handleEdit(category)}
                              actionType="edit"
                              buttonStyle="primary"
                              className="p-1 rounded-full"
                              buttonType="product"
                            />
                            <CrudButton
                              icon={Trash2}
                              onConfirm={() =>
                                handleDelete(category.code_categories)
                              }
                              actionType="delete"
                              buttonStyle="danger"
                              className="p-1 rounded-full"
                              title="Delete Product"
                              confirmMessage={
                                <>
                                  Are you sure you want to delete category{" "}
                                  <b className="text-gray-700">
                                    {category.name_categories}
                                  </b>
                                  ?
                                </>
                              }
                              buttonType="product"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No categories found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Alert Modal - higher z-index */}
      <div className="relative z-50">
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ isOpen: false, message: "" })}
          message={alertModal.message}
        />
      </div>

      {/* Success Modal */}
      <div className="relative z-50">
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, message: "" })}
          message={successModal.message}
        />
      </div>
    </div>
  );
};

export default Categories;
