import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  Clock,
  Target,
  Share2,
  CheckCircle,
  BarChart3,
  Calendar,
  Building,
  UserCheck,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Fetch system-wide analytics
  const fetchSystemAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/system?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching system analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch department analytics
  const fetchDepartmentAnalytics = async (departmentId) => {
    if (!departmentId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/department/${departmentId}?timeframe=${timeframe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartmentAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching department analytics:', error);
    }
  };

  useEffect(() => {
    fetchSystemAnalytics();
  }, [timeframe]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentAnalytics(selectedDepartment);
    }
  }, [selectedDepartment, timeframe]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = "text-blue-600" }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gray-100`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading || !analytics) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor system-wide question bank performance and usage</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === '7d' ? '7 Days' : 
               period === '30d' ? '30 Days' : 
               period === '90d' ? '90 Days' : '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Instructors"
          value={analytics.overview.totalInstructors}
          subtitle="Active instructors"
          trend={analytics.overview.instructorGrowth}
          color="text-blue-600"
        />
        <StatCard
          icon={BookOpen}
          title="Total Questions"
          value={analytics.overview.totalQuestions.toLocaleString()}
          subtitle="Across all departments"
          trend={analytics.overview.questionGrowth}
          color="text-green-600"
        />
        <StatCard
          icon={Share2}
          title="Shared Banks"
          value={analytics.overview.totalSharedBanks}
          subtitle="Collaborative question banks"
          trend={analytics.overview.sharedBankGrowth}
          color="text-purple-600"
        />
        <StatCard
          icon={CheckCircle}
          title="Approval Rate"
          value={`${analytics.overview.approvalRate}%`}
          subtitle="Questions approved"
          color="text-orange-600"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Distribution by Department */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Questions by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalQuestions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Question Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Question Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Departments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performing Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.departmentStats
                  .sort((a, b) => b.approvalRate - a.approvalRate)
                  .slice(0, 5)
                  .map((dept, index) => (
                    <motion.div
                      key={dept.department}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{dept.department}</h3>
                          <p className="text-sm text-gray-600">{dept.totalQuestions} questions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {dept.approvalRate}% approval rate
                        </Badge>
                        <p className="text-xs text-gray-500">{dept.activeInstructors} instructors</p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="flex gap-4 items-center mb-6">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Select Department</option>
              {analytics.departmentStats.map((dept) => (
                <option key={dept.department} value={dept.department}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>

          {selectedDepartment && departmentAnalytics ? (
            <div className="space-y-6">
              {/* Department Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  icon={Users}
                  title="Instructors"
                  value={departmentAnalytics.overview.totalInstructors}
                  color="text-blue-600"
                />
                <StatCard
                  icon={BookOpen}
                  title="Questions"
                  value={departmentAnalytics.overview.totalQuestions}
                  color="text-green-600"
                />
                <StatCard
                  icon={Share2}
                  title="Shared Banks"
                  value={departmentAnalytics.overview.sharedBanks}
                  color="text-purple-600"
                />
                <StatCard
                  icon={Target}
                  title="Approval Rate"
                  value={`${departmentAnalytics.overview.approvalRate}%`}
                  color="text-orange-600"
                />
              </div>

              {/* Department Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={departmentAnalytics.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id.date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="questions" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="approvals" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Instructors in Department */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentAnalytics.topInstructors.map((instructor, index) => (
                      <div key={instructor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{instructor.name}</p>
                            <p className="text-sm text-gray-600">{instructor.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{instructor.questionCount} questions</p>
                          <p className="text-sm text-gray-600">{instructor.approvalRate}% approved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Department</h3>
                <p className="text-gray-600">Choose a department to view detailed analytics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daily Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.activityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id.date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="questions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="approvals" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pending Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Pending</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {analytics.pendingReviews.total}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {analytics.pendingReviews.byDepartment.map((dept) => (
                      <div key={dept._id} className="flex justify-between items-center">
                        <span className="text-sm">{dept._id}</span>
                        <Badge variant="outline">{dept.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent System Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {activity.user?.name} • {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Question Quality</p>
                    <p className="text-2xl font-bold text-gray-900">8.4/10</p>
                    <p className="text-xs text-gray-500">Based on approvals</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions with Explanations</p>
                    <p className="text-2xl font-bold text-gray-900">72%</p>
                    <p className="text-xs text-gray-500">System-wide</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Review Time</p>
                    <p className="text-2xl font-bold text-gray-900">2.3 days</p>
                    <p className="text-xs text-gray-500">For approvals</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics by Department */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.qualityMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgQuality" fill="#8884d8" />
                  <Bar dataKey="explanationRate" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle>System Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.growthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="questions" stroke="#8884d8" strokeWidth={2} name="Questions" />
                  <Line type="monotone" dataKey="instructors" stroke="#82ca9d" strokeWidth={2} name="Instructors" />
                  <Line type="monotone" dataKey="sharedBanks" stroke="#ffc658" strokeWidth={2} name="Shared Banks" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Questions (Next Month)</span>
                    <span className="font-semibold text-green-600">+15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Instructors</span>
                    <span className="font-semibold text-blue-600">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shared Banks</span>
                    <span className="font-semibold text-purple-600">+12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Health</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Review Backlog</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User Engagement</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
