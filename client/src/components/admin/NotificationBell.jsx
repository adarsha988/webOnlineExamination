import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, User, FileText, Shield, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  // const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Simple toast function replacement
  const toast = ({ title, description, variant }) => {
    console.log(`${variant === 'destructive' ? 'Error' : 'Success'}: ${title} - ${description}`);
    // You can replace this with a proper toast implementation later
  };

  // Time ago utility function
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system':
        return AlertCircle;
      case 'user':
        return User;
      case 'exam':
        return FileText;
      case 'security':
        return Shield;
      default:
        return Bell;
    }
  };

  // Get notification color based on type and priority
  const getNotificationColor = (type, priority) => {
    if (priority === 'critical') {
      return 'bg-red-100 text-red-600';
    } else if (priority === 'high') {
      return 'bg-orange-100 text-orange-600';
    }
    
    switch (type) {
      case 'system':
        return 'bg-blue-100 text-blue-600';
      case 'user':
        return 'bg-green-100 text-green-600';
      case 'exam':
        return 'bg-purple-100 text-purple-600';
      case 'security':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add timeAgo to each notification
        const notificationsWithTime = data.notifications.map(notification => ({
          ...notification,
          timeAgo: getTimeAgo(notification.createdAt)
        }));
        
        if (reset) {
          setNotifications(notificationsWithTime);
        } else {
          setNotifications(prev => [...prev, ...notificationsWithTime]);
        }
        
        setHasMore(data.currentPage < data.totalPages);
        setPage(pageNum);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Success",
          description: "Notification marked as read",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast({
          title: "Success",
          description: "Notification deleted",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications deleted",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive"
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.link) {
      setLocation(notification.link);
      setIsOpen(false);
    }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
            setPage(1);
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 z-50"
          >
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">Notifications</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 h-7"
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all as read
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deleteAllNotifications}
                        className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 h-7"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete all
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 py-1 h-7"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                      <p className="text-gray-500 text-sm">You're all caught up! We'll let you know when something new happens.</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification, index) => {
                        const IconComponent = getNotificationIcon(notification.type);
                        const colorClass = getNotificationColor(notification.type, notification.priority);
                        
                        return (
                          <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group relative p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              !notification.isRead ? 'bg-blue-50/30' : 'bg-white'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Notification Icon */}
                              <div className={`relative p-2 rounded-full ${colorClass} flex-shrink-0`}>
                                <IconComponent className="h-4 w-4" />
                                {!notification.isRead && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* Title and Actions */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`text-sm text-gray-900 leading-5 ${
                                    !notification.isRead ? 'font-semibold' : 'font-medium'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Message */}
                                <p className="text-sm text-gray-600 mt-1 leading-5 line-clamp-2">
                                  {notification.message}
                                </p>
                                
                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-blue-600 font-medium">
                                      {notification.timeAgo}
                                    </span>
                                    {notification.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                        High
                                      </Badge>
                                    )}
                                    {notification.priority === 'critical' && (
                                      <Badge variant="destructive" className="text-xs px-2 py-0.5 animate-pulse">
                                        Critical
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Action buttons */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.isRead && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification._id);
                                        }}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Mark read
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification._id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Load More Button */}
                      {hasMore && (
                        <div className="p-4 text-center border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadMore}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                Loading...
                              </>
                            ) : (
                              'See more notifications'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
