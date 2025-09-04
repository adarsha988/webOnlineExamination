import React, { useState, useEffect } from 'react';
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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <Server className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Action Buttons */}
              <Button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => handleExportData('csv')}
                  className="mr-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportData('json')}
                >
                  Export JSON
                </Button>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
            <div className="space-y-8">
              <DashboardStats />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentActivity />
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setShowAddUserModal(true)}
                      className="h-20 flex-col"
                      variant="outline"
                    >
                      <Plus className="h-6 w-6 mb-2" />
                      Add User
                    </Button>
                    <Button
                      onClick={() => setActiveTab('reports')}
                      className="h-20 flex-col"
                      variant="outline"
                    >
                      <TrendingUp className="h-6 w-6 mb-2" />
                      View Reports
                    </Button>
                    <Button
                      onClick={() => handleExportData('csv')}
                      className="h-20 flex-col"
                      variant="outline"
                    >
                      <Download className="h-6 w-6 mb-2" />
                      Export Data
                    </Button>
                    <Button
                      onClick={() => setActiveTab('users')}
                      className="h-20 flex-col"
                      variant="outline"
                    >
                      <Users className="h-6 w-6 mb-2" />
                      Manage Users
                    </Button>
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
