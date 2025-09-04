import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  Server,
  Plus,
  Download,
  Settings,
  Bell,
  Search,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { logout } from '../../store/authSlice';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import UserManagement from './UserManagement';
import ReportsSection from './ReportsSection';
import AddUserModal from './AddUserModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const dispatch = useDispatch();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleExportData = async (format = 'json') => {
    try {
      const response = await fetch(`/api/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: `Data exported as ${format.toUpperCase()} file`,
          variant: "default"
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    // Show confirmation dialog
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      // Call logout API endpoint
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }

      // Dispatch Redux logout action to clear auth state
      dispatch(logout());

      // Clear all possible storage locations
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
        variant: "default"
      });

      // Force redirect to guest homepage
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, still clear local state
      dispatch(logout());
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged Out",
        description: "You have been logged out",
        variant: "default"
      });

      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="hidden lg:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <Server className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                />
              </div>
              
              {/* Mobile Search Button */}
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Action Buttons */}
              <Button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 hidden sm:flex"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
              
              {/* Mobile Add Button */}
              <Button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 sm:hidden"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              {/* Export Buttons - Hidden on mobile */}
              <div className="hidden md:flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportData('csv')}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportData('json')}
                  size="sm"
                >
                  JSON
                </Button>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* User Profile & Logout */}
              <div className="relative flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Admin</span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex space-x-1 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 min-w-0 flex-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="truncate">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6 lg:space-y-8">
              <DashboardStats />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-2">
                  <RecentActivity />
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setShowAddUserModal(true)}
                          className="h-16 sm:h-20 flex-col w-full"
                          variant="outline"
                        >
                          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                          <span className="text-xs sm:text-sm">Add User</span>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setActiveTab('reports')}
                          className="h-16 sm:h-20 flex-col w-full"
                          variant="outline"
                        >
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                          <span className="text-xs sm:text-sm">Reports</span>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleExportData('csv')}
                          className="h-16 sm:h-20 flex-col w-full"
                          variant="outline"
                        >
                          <Download className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                          <span className="text-xs sm:text-sm">Export</span>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setActiveTab('users')}
                          className="h-16 sm:h-20 flex-col w-full"
                          variant="outline"
                        >
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                          <span className="text-xs sm:text-sm">Users</span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Server Status</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Database</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Backup</span>
                        <span className="text-sm font-medium text-gray-900">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Sessions</span>
                        <span className="text-sm font-medium text-gray-900">24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement searchQuery={searchQuery} />
          )}

          {activeTab === 'reports' && (
            <ReportsSection />
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System Name
                      </label>
                      <Input defaultValue="Online Examination System" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email
                      </label>
                      <Input defaultValue="admin@example.com" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Session Timeout</h4>
                        <p className="text-sm text-gray-600">Automatically log out inactive users</p>
                      </div>
                      <Button variant="outline">Configure</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          setShowAddUserModal(false);
          // Refresh data if needed
        }}
      />
    </div>
  );
};

export default AdminDashboard;
