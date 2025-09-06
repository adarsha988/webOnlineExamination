import React, { useCallback, useEffect, useRef } from 'react';
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
  const renderCount = useRef(0);
  const isExecuting = useRef(false);

  // Track component renders
  renderCount.current += 1;
  console.log(`🔄 LOGOUT MODAL RENDER #${renderCount.current} - isOpen:`, isOpen, 'isExecuting:', isExecuting.current);

  // Track component mount/unmount
  useEffect(() => {
    console.log('🏗️ LOGOUT MODAL MOUNTED');
    return () => {
      console.log('🗑️ LOGOUT MODAL UNMOUNTED');
    };
  }, []);

  // Track isOpen changes
  useEffect(() => {
    console.log('👁️ LOGOUT MODAL isOpen CHANGED:', isOpen);
  }, [isOpen]);

  // Handle logout confirmation with useCallback to prevent double execution
  const handleLogout = useCallback(async () => {
    console.log('🔘 LOGOUT MODAL - Button clicked, execution check:', isExecuting.current);
    
    // Prevent double execution
    if (isExecuting.current) {
      console.log('🚫 LOGOUT MODAL - Already executing, ignoring click');
      return;
    }
    
    isExecuting.current = true;
    console.log('🔒 LOGOUT MODAL - Setting execution flag to true');
    
    // Prevent double execution by immediately closing modal
    console.log('🚪 LOGOUT MODAL - Closing modal');
    onClose();
    
    try {
      // Use the async logout thunk for smooth UX
      console.log('🔄 LOGOUT MODAL - Dispatching logoutUser action');
      const result = await dispatch(logoutUser());
      console.log('📊 LOGOUT MODAL - Dispatch result:', result);
      
      // Show success toast with green styling
      toast({
        title: "Logged out successfully! 🎉",
        description: "You have been logged out successfully",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      
      console.log('🏠 LOGOUT MODAL - Redirecting to homepage');
      
      // Add small delay to ensure Redux state is updated before redirect
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } catch (error) {
      console.error('💥 LOGOUT MODAL ERROR:', error);
      
      // Still redirect even if there's an error
      setTimeout(() => {
        setLocation('/');
      }, 100);
    } finally {
      console.log('🔓 LOGOUT MODAL - Resetting execution flag');
      isExecuting.current = false;
    }
  }, [dispatch, onClose, setLocation, toast]);

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
                    onClick={() => {
                      console.log('🖱️ LOGOUT BUTTON CLICKED - Event triggered');
                      handleLogout();
                    }}
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
