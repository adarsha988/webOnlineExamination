import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  Server,
  UserCheck,
  Clock
} from 'lucide-react';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalExams: 0,
    activeToday: 0,
    systemLoad: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [overview, activeToday, systemLoad] = await Promise.all([
        fetch('/api/stats/overview').then(res => res.json()),
        fetch('/api/stats/active-today').then(res => res.json()),
        fetch('/api/stats/system-load').then(res => res.json())
      ]);

      setStats({
        ...overview,
        activeToday: activeToday.activeUsers,
        systemLoad
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      growth: '+12%',
      description: 'All registered users'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'bg-green-500',
      growth: '+8%',
      description: 'Active student accounts'
    },
    {
      title: 'Instructors',
      value: stats.totalInstructors,
      icon: UserCheck,
      color: 'bg-purple-500',
      growth: '+5%',
      description: 'Teaching staff'
    },
    {
      title: 'Total Exams',
      value: stats.totalExams,
      icon: BookOpen,
      color: 'bg-orange-500',
      growth: '+15%',
      description: 'Created examinations'
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      icon: Activity,
      color: 'bg-red-500',
      growth: '+3%',
      description: 'Users active today'
    },
    {
      title: 'System Load',
      value: `${stats.systemLoad.cpuUsage || 0}%`,
      icon: Server,
      color: 'bg-indigo-500',
      growth: stats.systemLoad.cpuUsage > 70 ? 'High' : 'Normal',
      description: 'CPU utilization'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">System statistics and key metrics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-6 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      card.growth.includes('+') 
                        ? 'bg-green-100 text-green-800' 
                        : card.growth === 'High'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {card.growth}
                    </span>
                    <span className="text-xs text-gray-500">
                      {card.description}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8 bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.systemLoad.cpuUsage || 0}%
            </div>
            <div className="text-sm text-gray-600">CPU Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.systemLoad.cpuUsage || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.systemLoad.memoryUsage || 0}%
            </div>
            <div className="text-sm text-gray-600">Memory Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.systemLoad.memoryUsage || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.systemLoad.activeConnections || 0}
            </div>
            <div className="text-sm text-gray-600">Active Connections</div>
            <div className="flex items-center justify-center mt-2">
              <Clock className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">
                {stats.systemLoad.uptime || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.systemLoad.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="flex items-center justify-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                (stats.systemLoad.responseTime || 0) < 200 ? 'bg-green-500' : 
                (stats.systemLoad.responseTime || 0) < 500 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500">
                {(stats.systemLoad.responseTime || 0) < 200 ? 'Excellent' : 
                 (stats.systemLoad.responseTime || 0) < 500 ? 'Good' : 'Slow'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardStats;
