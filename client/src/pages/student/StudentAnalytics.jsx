import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Download, 
  BarChart3, 
  PieChart, 
  Target,
  Award,
  BookOpen,
  Calendar,
  Users,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { studentAnalyticsAPI } from '@/api/studentExams';
import { useLocation } from 'wouter';

const StudentAnalytics = () => {
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [, setLocation] = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [scoresOverTime, setScoresOverTime] = useState([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState([]);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState([]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const studentId = user._id || user.id;

      // Use fetch instead of axios to match other components
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [
        overviewRes,
        scoresRes,
        subjectsRes,
        difficultyRes,
        trendsRes
      ] = await Promise.all([
        fetch(`/api/analytics/student/${studentId}/overview`, { headers }),
        fetch(`/api/analytics/student/${studentId}/scores-over-time`, { headers }),
        fetch(`/api/analytics/student/${studentId}/subject-breakdown`, { headers }),
        fetch(`/api/analytics/student/${studentId}/difficulty-analysis`, { headers }),
        fetch(`/api/analytics/student/${studentId}/trends`, { headers })
      ]);

      const [overview, scores, subjects, difficulty, trends] = await Promise.all([
        overviewRes.json(),
        scoresRes.json(),
        subjectsRes.json(),
        difficultyRes.json(),
        trendsRes.json()
      ]);

      setOverview(overview.data || overview);
      setScoresOverTime(scores.data || scores || []);
      setSubjectBreakdown(subjects.data || subjects || []);
      setDifficultyAnalysis(difficulty.data || difficulty || []);
      setTrends(trends.data || trends || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await studentAnalyticsAPI.exportAnalytics(user._id, 'csv');
      toast({
        title: "Success",
        description: "Analytics exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatScoresData = (data) => {
    return data.map(item => ({
      ...item,
      date: new Date(item.submittedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  };

  const formatSubjectData = (data) => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  };

  const formatDifficultyData = (data) => {
    const difficultyOrder = ['easy', 'medium', 'hard'];
    return difficultyOrder.map(level => {
      const found = data.find(item => item.difficulty === level);
      return found || { difficulty: level, accuracy: 0, totalQuestions: 0 };
    });
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track your academic performance and progress over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setLocation('/student/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            <Button onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Average Score</p>
                      <p className="text-2xl font-bold text-blue-700">{overview.averageScore}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Best Score</p>
                      <p className="text-2xl font-bold text-green-700">{overview.bestScore}%</p>
                    </div>
                    <Award className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Pass Rate</p>
                      <p className="text-2xl font-bold text-purple-700">{overview.passRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Exams Taken</p>
                      <p className="text-2xl font-bold text-orange-700">{overview.examsAttempted}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="scores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scores">Score Trends</TabsTrigger>
            <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
            <TabsTrigger value="difficulty">Difficulty Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Scores Over Time
                </CardTitle>
                <CardDescription>
                  Track your exam scores and performance trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoresOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={formatScoresData(scoresOverTime)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, 'Score']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No score data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Subject Performance
                  </CardTitle>
                  <CardDescription>
                    Average scores by subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={formatSubjectData(subjectBreakdown)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ subject, averageScore }) => `${subject}: ${averageScore}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="averageScore"
                        >
                          {subjectBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No subject data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Subject Breakdown
                  </CardTitle>
                  <CardDescription>
                    Detailed performance by subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={subjectBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                        <Bar dataKey="averageScore" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No subject data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subject Details Table */}
            {subjectBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subject Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Subject</th>
                          <th className="text-center py-2">Exams Taken</th>
                          <th className="text-center py-2">Average Score</th>
                          <th className="text-center py-2">Best Score</th>
                          <th className="text-center py-2">Overall %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectBreakdown.map((subject, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 font-medium">{subject.subject}</td>
                            <td className="text-center py-3">{subject.totalExams}</td>
                            <td className="text-center py-3">
                              <Badge variant="outline" className="text-blue-600">
                                {subject.averageScore}%
                              </Badge>
                            </td>
                            <td className="text-center py-3">
                              <Badge variant="outline" className="text-green-600">
                                {subject.bestScore}%
                              </Badge>
                            </td>
                            <td className="text-center py-3">
                              <Badge variant="outline" className="text-purple-600">
                                {subject.overallPercentage}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="difficulty" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Difficulty Analysis
                  </CardTitle>
                  <CardDescription>
                    Performance by question difficulty
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {difficultyAnalysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatDifficultyData(difficultyAnalysis)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="difficulty" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                        <Bar dataKey="accuracy" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No difficulty data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Strength Analysis
                  </CardTitle>
                  <CardDescription>
                    Your performance radar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {difficultyAnalysis.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={formatDifficultyData(difficultyAnalysis)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="difficulty" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Accuracy"
                          dataKey="accuracy"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                        <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No radar data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Monthly performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id.period" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#3B82F6" 
                        name="Average Score"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bestScore" 
                        stroke="#10B981" 
                        name="Best Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentAnalytics;
