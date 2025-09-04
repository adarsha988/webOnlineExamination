import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { LogOut, User } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';

const StudentLayout = ({ children }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
            </div>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main>{children}</main>
      
      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
      />
    </div>
  );
};

export default StudentLayout;
