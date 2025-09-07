import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CalendarDays, 
  Timer, 
  Users, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import ExamCreationForm from './ExamCreationForm';

const InstructorDashboard = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalExams: 0,
    activeToday: 0,
    completedExams: 0,
    upcomingExams: 0
  });

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm, statusFilter]);

  const fetchExams = async () => {
    try {
      const instructorId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/exams/instructor/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const instructorId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/instructor/stats/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterExams = () => {
    let filtered = exams;

    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      published: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      ongoing: { color: 'bg-green-100 text-green-800', icon: Clock },
      completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      upcoming: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  const handleExamCreated = (newExam) => {
    setExams(prev => [newExam, ...prev]);
    setShowCreateForm(false);
    fetchStats();
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">
              ↗ {trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ExamCard = ({ exam }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
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
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(exam.status)}
          <div className="flex space-x-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <CalendarDays className="w-4 h-4 mr-1" />
          {exam.examDate ? formatDate(exam.examDate) : 'Not scheduled'}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-1" />
          {exam.assignedStudents?.length || 0} students
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your exams and track student performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Exams"
            value={stats.totalExams}
            icon={BookOpen}
            color="bg-blue-500"
            trend={12}
          />
          <StatCard
            title="Active Today"
            value={stats.activeToday}
            icon={Clock}
            color="bg-green-500"
            trend={8}
          />
          <StatCard
            title="Completed"
            value={stats.completedExams}
            icon={CheckCircle}
            color="bg-purple-500"
            trend={15}
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingExams}
            icon={CalendarDays}
            color="bg-orange-500"
            trend={5}
          />
        </div>

        {/* Exam Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Exam Management</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Exam
            </motion.button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          {/* Exams Grid */}
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredExams.map((exam) => (
                <ExamCard key={exam._id || exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first exam'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Exam
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exam Creation Modal */}
      {showCreateForm && (
        <ExamCreationForm
          onClose={() => setShowCreateForm(false)}
          onExamCreated={handleExamCreated}
        />
      )}
    </div>
  );
};

export default InstructorDashboard;
