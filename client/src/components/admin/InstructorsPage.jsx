import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import UserManagement from './UserManagement';

const InstructorsPage = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Instructors Management</h1>
                <p className="text-gray-600">Manage all instructor accounts and their information</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instructors List - Using UserManagement with instructor filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <InstructorsList />
      </motion.div>
    </div>
  );
};

// Custom component that wraps UserManagement with instructor-specific filtering
const InstructorsList = () => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Instructors</h2>
            <p className="text-sm text-gray-600">View and manage instructor accounts</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <UserManagement defaultRole="instructor" />
      </div>
    </div>
  );
};

export default InstructorsPage;
