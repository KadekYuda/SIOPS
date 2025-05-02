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
  buttonType = "default",
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

  const buttonClasses = `
    inline-flex items-center justify-center transition-all duration-200 
    ${
      buttonType === "product"
        ? `${
            actionType === "edit" || actionType === "delete"
              ? "p-2 rounded-lg hover:shadow-sm"
              : "px-4 py-2 rounded-lg shadow-sm hover:shadow"
          }
        ${
          buttonStyle === "primary"
            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            : ""
        }
        ${
          buttonStyle === "secondary"
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : ""
        }
        ${
          buttonStyle === "danger"
            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
            : ""
        }`
        : `${
            buttonStyle === "primary"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : ""
          }
        ${
          buttonStyle === "secondary"
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : ""
        }
        ${
          buttonStyle === "danger"
            ? "bg-red-600 text-white hover:bg-red-700"
            : ""
        }
        px-4 py-2 rounded-lg shadow-sm hover:shadow
    `
    }
    ${className}
  `;

  return (
    <div>
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

      {/* Modal Konfirmasi */}
      {isConfirmModalOpen && (
        <DeleteModal
          open={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
        >
          <div className="text-center max-w-sm mx-auto">
            <Icon size={48} className="mx-auto text-red-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmMessage}</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleConfirmFirstModal}
              >
                Delete
              </button>
            </div>
          </div>
        </DeleteModal>
      )}

      {/* Modal Konfirmasi Final */}
      {isDataModalOpen && (
        <DeleteModal
          open={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
        >
          <div className="text-center max-w-sm mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">{dataMessage}</p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setIsDataModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleConfirmSecondModal}
              >
                Confirm
              </button>
            </div>
          </div>
        </DeleteModal>
      )}
    </div>
  );
};

export default CrudButton;
