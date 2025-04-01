import DeleteModal from "../modal/DeleteModal";
import { useState } from "react";
import { Trash2 } from "lucide-react";
const CrudButton = ({
  icon: Icon,
  label,
  onConfirm,
  onClick,
  confirmMessage = "Are you sure you want to proceed with this action?",
  dataMessage = "This action cannot be undone.",
  title = "Confirm Action",
  actionType = "default",
  className = "",
  buttonStyle = "primary",
  buttonType = "default", // Tambahkan prop buttonType
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const handleConfirmFirstModal = () => {
    setIsConfirmModalOpen(false);
    setIsDataModalOpen(true);
  };

  const handleConfirmSecondModal = () => {
    if (onConfirm) onConfirm();
    setIsDataModalOpen(false);
  };

  const handleClick = () => {
    if (actionType === "delete") {
      setIsConfirmModalOpen(true);
    } else {
      onClick?.();
    }
  };

  // Styling kondisional berdasarkan buttonType
  const buttonClasses = `
    ${
      buttonType === "product"
        ? // Styling untuk tombol produk
          `${
            actionType === "edit" || actionType === "delete"
              ? "p-1 rounded-full"
              : "px-4 py-2 rounded-lg"
          }
          ${
            buttonStyle === "primary"
              ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              : ""
          }
          ${
            buttonStyle === "secondary"
              ? "bg-green-600 text-white hover:bg-green-700"
              : ""
          }
          ${
            buttonStyle === "danger"
              ? "text-red-600 hover:text-red-800 hover:bg-red-50"
              : ""
          }
          transition-colors duration-150`
        : // Styling untuk tombol pengguna umum
          `btn
          ${
            buttonStyle === "primary"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : ""
          }
          ${
            buttonStyle === "secondary"
              ? "bg-green-500 text-white hover:bg-green-600"
              : ""
          }
          ${
            buttonStyle === "danger"
              ? "bg-red-600 text-white hover:bg-red-700"
              : ""
          }`
    }
    ${className}
  `;

  return (
    <div>
      {/* Tombol Utama */}
      <button className={buttonClasses} onClick={handleClick}>
        {Icon && (
          <Icon
            size={
              buttonType === "product" &&
              (actionType === "edit" || actionType === "delete")
                ? 18
                : 20
            }
            className={label ? "mr-2" : ""}
          />
        )}
        {label}
      </button>

      {/* Modal Konfirmasi Pertama (Style 1) */}
      {isConfirmModalOpen && (
        <DeleteModal open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
          <div className="text-center w-56">
            <Icon size={56} className="mx-auto text-red-600" />
            <div className="mx-auto my-4 w-48">
              <h3 className="text-lg font-black text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500">{confirmMessage}</p>
            </div>
            <div className="flex gap-4">
              <button
                className="btn bg-red-600 text-white w-full hover:bg-red-700"
                onClick={handleConfirmFirstModal}
              >
                Confirm
              </button>
              <button
                className="btn bg-gray-300 text-gray-800 w-full hover:bg-gray-400"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </DeleteModal>
      )}

      {/* Modal Data yang Akan Dihapus (Style 2) */}
      {isDataModalOpen && (
        <div className="relative z-50">
          <DeleteModal
            open={isDataModalOpen}
            onClose={() => setIsDataModalOpen(false)}
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Are You Sure Want To Delete?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 max-w-xs mx-auto whitespace-normal">
                  {dataMessage}
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={() => setIsDataModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                onClick={handleConfirmSecondModal}
              >
                Delete
              </button>
            </div>
          </DeleteModal>
        </div>
      )}
    </div>
  );
};

export default CrudButton;