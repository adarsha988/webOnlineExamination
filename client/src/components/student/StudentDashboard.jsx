import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CalendarDays, 
  Timer, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  Trophy,
  TrendingUp,
  Play,
  Eye,
  Calendar,
  Target,
  Bell
} from 'lucide-react';
import { studentExamAPI, studentNotificationsAPI } from '../../api/studentExams';

const StudentDashboard = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [ongoingExams, setOngoingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get authenticated user email from localStorage or use a valid test email
      const studentId = localStorage.getItem('userEmail') || 'sophia@student.edu';
      
      console.log('🔍 FETCHING DASHBOARD DATA FOR:', studentId);
      console.log('📧 Using authenticated user email instead of UUID');
      
      const [upcomingResponse, ongoingResponse, completedResponse, notificationsResponse] = await Promise.allSettled([
        studentExamAPI.getUpcomingExams(studentId).catch(err => {
          console.error('❌ UPCOMING EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentExamAPI.getOngoingExams(studentId).catch(err => {
          console.error('❌ ONGOING EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentExamAPI.getCompletedExams(studentId, 1, 5).catch(err => {
          console.error('❌ COMPLETED EXAMS ERROR:', err);
          return { data: [] };
        }),
        studentNotificationsAPI.getNotifications(studentId, 1, 5, false).catch(err => {
          console.error('❌ NOTIFICATIONS ERROR:', err);
          return { data: [] };
        })
      ]);

      console.log('✅ DASHBOARD: API responses received');
      console.log('📈 Upcoming:', upcomingResponse.status === 'fulfilled' ? upcomingResponse.value : upcomingResponse.reason);
      console.log('🔄 Ongoing:', ongoingResponse.status === 'fulfilled' ? ongoingResponse.value : ongoingResponse.reason);
      console.log('✅ Completed:', completedResponse.status === 'fulfilled' ? completedResponse.value : completedResponse.reason);
      console.log('🔔 Notifications:', notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : notificationsResponse.reason);

      // Set data from successful responses
      if (upcomingResponse.status === 'fulfilled') {
        setUpcomingExams(upcomingResponse.value.data || []);
      }
      if (ongoingResponse.status === 'fulfilled') {
        setOngoingExams(ongoingResponse.value.data || []);
      }
      if (completedResponse.status === 'fulfilled') {
        setCompletedExams(completedResponse.value.data || []);
      }
      if (notificationsResponse.status === 'fulfilled') {
        setNotifications(notificationsResponse.value.data || []);
      }

      // Update stats
      const totalUpcoming = upcomingResponse.status === 'fulfilled' ? (upcomingResponse.value.data || []).length : 0;
      const totalCompleted = completedResponse.status === 'fulfilled' ? (completedResponse.value.data || []).length : 0;
      
      setStats({
        totalExams: totalUpcoming + totalCompleted,
        completedExams: totalCompleted,
        averageScore: 85, // Default for now
        upcomingCount: totalUpcoming
      });

    } catch (error) {
      console.error('❌ DASHBOARD ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExams = (exams) => {
    return exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || exam.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  };

  const getUniqueSubjects = () => {
    const allExams = [...upcomingExams, ...completedExams];
    const subjects = [...new Set(allExams.map(exam => exam.subject))];
    return subjects;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilExam = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffTime = exam - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `${diffDays} days`;
    return 'Past due';
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ExamCard = ({ exam, type = 'upcoming' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
            {type === 'upcoming' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                {getTimeUntilExam(exam.examDate)}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {exam.subject}
            </div>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              {exam.duration} min
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              {exam.totalMarks} marks
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <CalendarDays className="w-4 h-4 mr-1" />
          {formatDate(exam.examDate)}
        </div>
        
        <div className="flex space-x-2">
          {type === 'upcoming' ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-3 h-3 mr-1" />
              Take Exam
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Results
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const SectionHeader = ({ title, count, isExpanded, onToggle, icon: Icon }) => (
    <motion.div
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center">
        <Icon className="w-5 h-5 text-gray-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          {count}
        </span>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredUpcoming = getFilteredExams(upcomingExams);
  const filteredCompleted = getFilteredExams(completedExams);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your exams and academic progress</p>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Exams"
            value={stats.totalExams || 320}
            icon={BookOpen}
            color="bg-blue-500"
            subtitle="All time"
            trend="+12% this month"
          />
          <StatCard
            title="Completed"
            value={stats.completedExams || 89}
            icon={CheckCircle}
            color="bg-green-500"
            subtitle="This semester"
            trend="+8% this week"
          />
          <StatCard
            title="Average Score"
            value={`${stats.averageScore || 85}%`}
            icon={Trophy}
            color="bg-purple-500"
            subtitle="Overall performance"
            trend="+5% improvement"
          />
          <StatCard
            title="Upcoming"
            value={upcomingExams.length}
            icon={Calendar}
            color="bg-orange-500"
            subtitle="Next 30 days"
          />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search exams by title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Upcoming Exams Section */}
        <div className="mb-8">
          <SectionHeader
            title="Upcoming Exams"
            count={filteredUpcoming.length}
            isExpanded={showUpcoming}
            onToggle={() => setShowUpcoming(!showUpcoming)}
            icon={AlertCircle}
          />
          
          <AnimatePresence>
            {showUpcoming && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                {filteredUpcoming.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredUpcoming.map((exam) => (
                      <ExamCard key={exam._id || exam.id} exam={exam} type="upcoming" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming exams</h3>
                    <p className="text-gray-600">
                      {searchTerm || subjectFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'You\'re all caught up! No exams scheduled at the moment.'
                      }
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Completed Exams Section */}
        <div className="mb-8">
          <SectionHeader
            title="Completed Exams"
            count={filteredCompleted.length}
            isExpanded={showCompleted}
            onToggle={() => setShowCompleted(!showCompleted)}
            icon={CheckCircle}
          />
          
          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                {filteredCompleted.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCompleted.map((exam) => (
                      <ExamCard key={exam._id || exam.id} exam={exam} type="completed" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed exams</h3>
                    <p className="text-gray-600">
                      {searchTerm || subjectFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'You haven\'t completed any exams yet.'
                      }
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
