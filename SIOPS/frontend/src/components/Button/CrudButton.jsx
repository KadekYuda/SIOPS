import DeleteModal from "../modal/DeleteModal";
import { useState } from "react";

const CrudButton = ({
  icon: Icon,
  label,
  onConfirm,
  onClick,
  confirmMessage = "Are you sure you want to proceed with this action?",
  title = "Confirm Action",
  actionType = "default",
  className = "",
  buttonStyle = "primary",
  buttonType = "default", // Tambahkan prop buttonType
}) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setOpen(false);
  };

  const handleClick = () => {
    if (actionType === "delete") {
      setOpen(true);
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

      {actionType === "delete" && open && (
        <DeleteModal open={open} onClose={() => setOpen(false)}>
          <div className="text-center w-56">
            <Icon size={56} className="mx-auto text-red-600" />
            <div className="mx-auto my-4 w-48">
              <h3 className="text-lg font-black text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500">{confirmMessage}</p>
            </div>
            <div className="flex gap-4">
              <button
                className="btn bg-red-600 text-white w-full hover:bg-red-700"
                onClick={handleConfirm}
              >
                Delete
              </button>
              <button
                className="btn bg-gray-300 text-gray-800 w-full hover:bg-gray-400"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </DeleteModal>
      )}
    </div>
  );
};

export default CrudButton;
