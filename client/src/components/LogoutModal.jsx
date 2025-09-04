import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { logoutUser } from '../store/authSlice';
import { useToast } from '@/hooks/useToast';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle logout confirmation
  const handleLogout = async () => {
    // Use the async logout thunk for smooth UX
    await dispatch(logoutUser());
    
    // Show success toast with green styling
    toast({
      title: "Logged out successfully! 🎉",
      description: "You have been logged out successfully",
      variant: "default",
      className: "border-green-200 bg-green-50 text-green-800",
    });
    
    // Close modal and redirect to homepage
    onClose();
    setLocation('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Logout
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Are you sure you want to log out? You'll need to sign in again to access your account.
                </p>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
