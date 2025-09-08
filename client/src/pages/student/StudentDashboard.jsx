import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Bell, 
  TrendingUp, 
  Calendar,
  Play,
  Eye,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { studentExamAPI, studentNotificationsAPI } from '@/api/studentExams';
import NotificationDropdown from '@/components/student/NotificationDropdown';
import ExamCard from '@/components/student/ExamCard';
import StudentLayout from '@/layouts/StudentLayout';
import { useLocation } from 'wouter';

const StudentDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [ongoingExams, setOngoingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('🔍 DASHBOARD: useEffect triggered, user:', user);
    if (user && user.email) {
      console.log('✅ DASHBOARD: User found, calling fetchDashboardData');
      fetchDashboardData();
    } else {
      console.log('❌ DASHBOARD: No user or user identifier found');
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const studentIdentifier = user.email;
      console.log('📊 DASHBOARD: Fetching data for student:', studentIdentifier);
      console.log('👤 DASHBOARD: User object:', user);

      // Fetch all dashboard data in parallel
      console.log('🔄 DASHBOARD: Starting API calls...');
      const [
        upcomingRes,
        ongoingRes,
        completedRes,
        notificationsRes
      ] = await Promise.all([
        studentExamAPI.getUpcomingExams(studentIdentifier).catch(err => {
          console.error('❌ UPCOMING EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentExamAPI.getOngoingExams(studentIdentifier).catch(err => {
          console.error('❌ ONGOING EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentExamAPI.getCompletedExams(studentIdentifier, 1, 5).catch(err => {
          console.error('❌ COMPLETED EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentNotificationsAPI.getNotifications(studentIdentifier, 1, 5).catch(err => {
          console.error('❌ NOTIFICATIONS ERROR:', err);
          return { data: [] };
        })
      ]);

      console.log('✅ DASHBOARD: API responses received');
      console.log('📈 Upcoming:', upcomingRes);
      console.log('🔄 Ongoing:', ongoingRes);
      console.log('✅ Completed:', completedRes);
      console.log('🔔 Notifications:', notificationsRes);

      setUpcomingExams(upcomingRes.data || []);
      setOngoingExams(ongoingRes.data || []);
      setCompletedExams(completedRes.data || []);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(notificationsRes.unreadCount || 0);

      // Store analytics data for future use
      if (completedRes.data && completedRes.data.length > 0) {
        const analyticsData = {
          completedExams: completedRes.data,
          totalExams: completedRes.data.length,
          averageScore: completedRes.data.reduce((sum, exam) => sum + (exam.percentage || 0), 0) / completedRes.data.length,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('studentAnalytics', JSON.stringify(analyticsData));
        console.log('📊 Analytics data stored:', analyticsData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      const studentIdentifier = user.email;
      const response = await studentExamAPI.startExam(examId, studentIdentifier, {});
      if (response.success) {
        setLocation(`/student/exam/${examId}`);
        toast({
          title: "Exam Started",
          description: "Good luck with your exam!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start exam",
        variant: "destructive",
      });
    }
  };

  const handleResumeExam = (examId) => {
    setLocation(`/student/exam/${examId}`);
  };

  const handleViewResult = (examId) => {
    setLocation(`/student/exam/${examId}/result`);
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  };

  const getExamStatusBadge = (exam) => {
    const now = new Date();
    const scheduledDate = new Date(exam.scheduledDate);
    const endDate = new Date(exam.endDate);

    if (exam.studentStatus === 'in_progress') {
      return <Badge variant="default" className="bg-yellow-500">In Progress</Badge>;
    }
    if (exam.studentStatus === 'submitted') {
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    }
    if (scheduledDate > now) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    if (endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="default" className="bg-blue-500">Available</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your exams today.
              </p>
            </div>
            <NotificationDropdown 
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={fetchDashboardData}
            />
          </div>


        {/* Main Content */}
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exams">My Exams</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            {/* Ongoing Exams */}
            {ongoingExams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Ongoing Exams
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ongoingExams.map((exam) => (
                    <Card key={exam._id} className="border-yellow-200 bg-yellow-50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{exam.examId?.title || exam.title || 'Untitled Exam'}</CardTitle>
                            <CardDescription>{exam.examId?.subject || exam.subject || 'No Subject'}</CardDescription>
                          </div>
                          <Badge variant="default" className="bg-yellow-500">
                            In Progress
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">
                            {formatTimeRemaining(exam.timeRemaining)}
                          </div>
                          <Button 
                            onClick={() => handleResumeExam(exam.examId?._id || exam._id)}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume Exam
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upcoming Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Exams
              </h2>
              {upcomingExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingExams.map((exam) => (
                    <ExamCard
                      key={exam._id}
                      exam={exam}
                      onStart={handleStartExam}
                      type="upcoming"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming exams</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Recent Completed Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Recent Results
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/student/exams/completed')}
                >
                  View All
                </Button>
              </div>
              {completedExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedExams.map((exam) => (
                    <ExamCard
                      key={exam._id}
                      exam={exam}
                      onViewResult={handleViewResult}
                      type="completed"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No completed exams yet</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>


          <TabsContent value="notifications">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Notifications</h2>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/student/notifications')}
                >
                  View All
                </Button>
              </div>
              
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card key={notification._id} className={!notification.isRead ? 'border-blue-200 bg-blue-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
