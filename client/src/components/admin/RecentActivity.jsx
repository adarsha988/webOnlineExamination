import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity as ActivityIcon, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Users,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recent-activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login':
      case 'user_logout':
      case 'user_created':
        return User;
      case 'exam_started':
      case 'exam_completed':
      case 'exam_created':
        return BookOpen;
      case 'report_generated':
        return FileText;
      case 'system_error':
        return AlertTriangle;
      default:
        return ActivityIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_login':
      case 'user_created':
      case 'exam_completed':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'user_logout':
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
      case 'exam_started':
      case 'exam_created':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'report_generated':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'system_error':
        return { bg: 'bg-red-100', text: 'text-red-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'user_login':
      case 'user_created':
      case 'exam_completed':
        return { variant: 'default', label: 'Success' };
      case 'exam_started':
      case 'exam_created':
        return { variant: 'secondary', label: 'Active' };
      case 'report_generated':
        return { variant: 'outline', label: 'Generated' };
      case 'system_error':
        return { variant: 'destructive', label: 'Error' };
      default:
        return { variant: 'secondary', label: 'Info' };
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
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ActivityIcon className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center space-x-4 p-3 rounded-lg animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ActivityIcon className="h-5 w-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activities</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {displayedActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const colors = getActivityColor(activity.type);
                const badge = getActivityBadge(activity.type);
                
                return (
                  <motion.div
                    key={activity._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      console.log('Navigate to activity:', activity);
                    }}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                      <IconComponent className={`h-5 w-5 ${colors.text}`} />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View activity details:', activity);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

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
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
