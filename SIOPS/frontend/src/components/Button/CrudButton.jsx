import DeleteModal from "../modal/DeleteModal";
import { useState } from "react";

const CrudButton = ({ 
  icon: Icon, 
  label, // Label teks tombol
  onConfirm, // Fungsi untuk aksi yang memerlukan konfirmasi (seperti delete)
  onClick, // Fungsi untuk aksi tanpa konfirmasi (seperti edit atau add)
  confirmMessage = "Apakah Anda yakin ingin melakukan aksi ini?", // Pesan konfirmasi default
  title = "Confirm Action", // Judul modal konfirmasi
  actionType = "default", // Jenis aksi: "delete", "edit", atau "add"
  className = "", // Kelas tambahan untuk styling tombol
  buttonStyle = "primary" // Style default tombol
}) => {
  const [open, setOpen] = useState(false);

  // Fungsi untuk menangani aksi delete yang memerlukan konfirmasi
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setOpen(false); // Tutup modal setelah konfirmasi
  };

  // Handle tombol saat diklik
  const handleClick = () => {
    if (actionType === "delete") {
      setOpen(true); // Buka modal konfirmasi jika actionType adalah "delete"
    } else {
      onClick(); // Jalankan fungsi onClick langsung untuk edit atau add
    }
  };

  // Kelas dinamis berdasarkan buttonStyle
  const buttonClasses = `
    btn
    ${buttonStyle === "primary" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}
    ${buttonStyle === "secondary" ? "bg-green-500 text-white hover:bg-green-600" : ""}
    ${buttonStyle === "danger" ? "bg-red-600 text-white hover:bg-red-700" : ""}
    ${className}
  `;

  return (
    <div>
      <button className={buttonClasses} onClick={handleClick}>
        {Icon && <Icon className="mr-2" />} {label}
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
              <button className="btn bg-red-600 text-white w-full hover:bg-red-700" onClick={handleConfirm}>
                Delete
              </button>
              <button className="btn bg-gray-300 text-gray-800 w-full hover:bg-gray-400" onClick={() => setOpen(false)}>
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
