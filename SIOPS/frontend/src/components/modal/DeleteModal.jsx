import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteModal({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white rounded-xl shadow p-6"
            onClick={(e) => e.stopPropagation()} // Mencegah penutupan modal saat mengklik konten modal
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
