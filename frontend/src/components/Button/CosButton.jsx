
import DeleteModal from "../modal/DeleteModal";
import { useState } from "react";

const CosButton = ({ 
  icon: Icon, // Ikon tombol yang dapat dikustomisasi
  label, // Label teks tombol
  onConfirm, // Fungsi untuk aksi yang memerlukan konfirmasi (seperti delete)
  onClick, // Fungsi untuk aksi tanpa konfirmasi (seperti edit atau add)
  confirmMessage = "Apakah Anda yakin ingin melakukan aksi ini?", // Pesan konfirmasi default
  title = "Confirm Action", // Judul modal konfirmasi
  actionType = "default", // Jenis aksi: "delete", "edit", atau "add"
  className = "", // Kelas tambahan untuk styling tombol
  buttonStyle = "btn btn-primary" // Style default tombol
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

  return (
    <div>
      <button className={`${buttonStyle} ${className}`} onClick={handleClick}>
        <Icon className="mr-2" /> {label}
      </button>

      {actionType === "delete" && (
        <DeleteModal open={open} onClose={() => setOpen(false)}>
          <div className="text-center w-56">
            <Icon size={56} className="mx-auto text-red-600" />
            <div className="mx-auto my-4 w-48">
              <h3 className="text-lg font-black text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500">{confirmMessage}</p>
            </div>
            <div className="flex gap-4">
              <button className="btn btn-danger w-full" onClick={handleConfirm}>
                Delete
              </button>
              <button className="btn btn-light w-full" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </DeleteModal>
      )}
    </div>
  );
};

export default CosButton;
