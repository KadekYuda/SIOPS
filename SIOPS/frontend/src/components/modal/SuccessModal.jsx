import { motion } from "framer-motion";
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative"
      >
        <motion.div 
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center mb-4"
        >
          <CheckCircle className="text-green-500" size={48} />
        </motion.div>
        <h3 className="text-lg font-semibold text-center mb-4">Success</h3>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            OK
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessModal;
