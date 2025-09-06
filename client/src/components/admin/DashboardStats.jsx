import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useLocation } from 'wouter';

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalExams: 0,
    activeToday: 0,
    systemHealth: 'Good'
  });
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch comprehensive stats from multiple endpoints
      const [overviewRes, studentsRes, instructorsRes, systemRes] = await Promise.all([
        fetch('/api/stats/overview'),
        fetch('/api/stats/students'),
        fetch('/api/stats/instructors'),
        fetch('/api/stats/system-load')
      ]);

      const [overview, students, instructors, systemLoad] = await Promise.all([
        overviewRes.ok ? overviewRes.json() : {},
        studentsRes.ok ? studentsRes.json() : {},
        instructorsRes.ok ? instructorsRes.json() : {},
        systemRes.ok ? systemRes.json() : {}
      ]);

      setStats({
        ...overview,
        totalStudents: students.total || 0,
        totalInstructors: instructors.total || 0,
        systemLoad: systemLoad
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active users`,
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      route: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents || 0,
      subtitle: 'Enrolled students',
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      route: '/admin/students',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Total Instructors',
      value: stats.totalInstructors || 0,
      subtitle: 'Teaching staff',
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      route: '/admin/instructors',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Total Exams',
      value: stats.totalExams,
      subtitle: 'Available examinations',
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      route: '/admin/exams',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      subtitle: 'Users active today',
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      route: '/admin/analytics',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'System Analytics',
      value: `${stats.systemLoad?.cpu || 45}%`,
      subtitle: `${stats.systemLoad?.memory || 62}% memory, ${stats.systemLoad?.requests || 120}/min`,
      icon: (
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      route: '/admin/system-analytics',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleCardClick = (route) => {
    setLocation(route);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {metricCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 border-0 bg-white shadow-md rounded-xl p-6 group relative overflow-hidden"
            onClick={() => handleCardClick(card.route)}
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 p-0">
              <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-gray-900 transition-colors duration-300">
                {card.title}
              </CardTitle>
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="group-hover:text-blue-600 transition-colors duration-300"
              >
                {card.icon}
              </motion.div>
            </CardHeader>
            <CardContent className="relative z-10 p-0 pt-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </div>
              <p className="text-sm text-gray-600 group-hover:text-gray-600 transition-colors duration-300">
                {card.subtitle}
              </p>
              
              {/* Click indicator */}
              <motion.div
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
              >
                <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default DashboardStats;
