import { Trash2 } from "lucide-react";
import DeleteModal from "../modal/DeleteModal";
import { useState } from "react";

const Trash = ({ onConfirm, confirmMessage = "Are you sure you want to delete this item?", title = "Confirm Delete" }) => {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onConfirm(); // Panggil fungsi yang diteruskan dari komponen induk
    setOpen(false); // Tutup modal setelah konfirmasi
  };

  return (
    <div>
      <button className="btn btn-danger" onClick={() => setOpen(true)}>
        <Trash2 /> Delete
      </button>
      <DeleteModal open={open} onClose={() => setOpen(false)}>
        <div className="text-center w-56">
          <Trash2 size={56} className="mx-auto text-red-600" />
          <div className="mx-auto my-4 w-48">
            <h3 className="text-lg font-black text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{confirmMessage}</p>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-danger w-full" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn btn-light w-full" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </DeleteModal>
    </div>
  );
};

export default Trash;
