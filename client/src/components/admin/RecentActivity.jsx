import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  LogIn, 
  LogOut, 
  UserPlus, 
  FileText, 
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/activities?limit=10&sort=createdAt:desc');
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login':
        return LogIn;
      case 'user_logout':
        return LogOut;
      case 'user_created':
        return UserPlus;
      case 'user_updated':
        return User;
      case 'exam_created':
        return FileText;
      case 'exam_submitted':
        return CheckCircle;
      case 'system_error':
        return XCircle;
      case 'admin_action':
        return Settings;
      default:
        return AlertCircle;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_login':
        return 'text-green-600 bg-green-100';
      case 'user_logout':
        return 'text-gray-600 bg-gray-100';
      case 'user_created':
        return 'text-blue-600 bg-blue-100';
      case 'user_updated':
        return 'text-yellow-600 bg-yellow-100';
      case 'exam_created':
        return 'text-purple-600 bg-purple-100';
      case 'exam_submitted':
        return 'text-green-600 bg-green-100';
      case 'system_error':
        return 'text-red-600 bg-red-100';
      case 'admin_action':
        return 'text-indigo-600 bg-indigo-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'user_login':
      case 'user_logout':
        return { label: 'Auth', variant: 'secondary' };
      case 'user_created':
      case 'user_updated':
        return { label: 'User', variant: 'default' };
      case 'exam_created':
      case 'exam_submitted':
        return { label: 'Exam', variant: 'outline' };
      case 'system_error':
        return { label: 'Error', variant: 'destructive' };
      case 'admin_action':
        return { label: 'Admin', variant: 'secondary' };
      default:
        return { label: 'System', variant: 'outline' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showAll ? 'Show Less' : 'View All'}
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            const badge = getActivityBadge(activity.type);

            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description || 'System activity'}
                    </p>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(activity.createdAt)}</span>
                    {activity.user && (
                      <>
                        <span>•</span>
                        <span>{activity.user.name || activity.user.email}</span>
                      </>
                    )}
                    {activity.ipAddress && (
                      <>
                        <span>•</span>
                        <span>{activity.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Handle activity detail view
                      console.log('View activity details:', activity);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activities.length > 5 && !showAll && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            className="w-full"
          >
            View {activities.length - 5} More Activities
          </Button>
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {activities.filter(a => a.type.includes('user')).length}
            </div>
            <div className="text-xs text-gray-600">User Actions</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {activities.filter(a => a.type.includes('exam')).length}
            </div>
            <div className="text-xs text-gray-600">Exam Activities</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {activities.filter(a => a.type === 'system_error').length}
            </div>
            <div className="text-xs text-gray-600">System Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
