import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Line
} from 'recharts';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Camera, 
  Mic, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ProctoringDashboard = ({ examId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [examId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/proctoring/dashboard/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch proctoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No proctoring data available</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    overview, 
    students, 
    violations, 
    analytics 
  } = dashboardData;

  // Chart colors
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  // Risk level colors
  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-blue-600">{overview.activeStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-red-600">{overview.totalViolations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Students</p>
                <p className="text-2xl font-bold text-orange-600">{overview.highRiskStudents}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold text-purple-600">{overview.avgRiskScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students">Student Monitoring</TabsTrigger>
          <TabsTrigger value="violations">Violation Analysis</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>

        {/* Student Monitoring Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div 
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {student.cameraActive ? (
                          <Camera className="h-4 w-4 text-green-500" />
                        ) : (
                          <Camera className="h-4 w-4 text-red-500" />
                        )}
                        {student.micActive ? (
                          <Mic className="h-4 w-4 text-green-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Violations: {student.violationCount}</p>
                        <p className="text-sm text-gray-600">Tab Switches: {student.tabSwitches}</p>
                      </div>
                      
                      <Badge className={getRiskColor(student.riskScore)}>
                        {getRiskLabel(student.riskScore)} ({student.riskScore}%)
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        {student.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {student.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {student.status === 'terminated' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violation Analysis Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Violation Types Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Violation Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violations.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {violations.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Violations Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Violations Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={violations.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Violation Severity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Severity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={violations.bySeverity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Confidence Scores */}
            <Card>
              <CardHeader>
                <CardTitle>AI Detection Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Face Detection</span>
                      <span>{analytics.faceDetectionConfidence}%</span>
                    </div>
                    <Progress value={analytics.faceDetectionConfidence} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Gaze Tracking</span>
                      <span>{analytics.gazeTrackingConfidence}%</span>
                    </div>
                    <Progress value={analytics.gazeTrackingConfidence} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Audio Analysis</span>
                      <span>{analytics.audioAnalysisConfidence}%</span>
                    </div>
                    <Progress value={analytics.audioAnalysisConfidence} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Behavioral Analysis</span>
                      <span>{analytics.behavioralConfidence}%</span>
                    </div>
                    <Progress value={analytics.behavioralConfidence} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anomaly Detection */}
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Detection Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{anomaly.type}</p>
                        <p className="text-sm text-gray-600">{anomaly.description}</p>
                      </div>
                      <Badge className={getRiskColor(anomaly.confidence)}>
                        {anomaly.confidence}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.accuracy}%</p>
                  <p className="text-sm text-gray-600">Overall Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.precision}%</p>
                  <p className="text-sm text-gray-600">Precision</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{analytics.recall}%</p>
                  <p className="text-sm text-gray-600">Recall</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedStudent.name} - Detailed Analysis</span>
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Risk Score</p>
                    <p className="text-2xl font-bold">{selectedStudent.riskScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Violations</p>
                    <p className="text-2xl font-bold">{selectedStudent.violationCount}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Recent Violations</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedStudent.recentViolations?.map((violation, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{violation.type}</span>
                        <Badge variant="outline">{violation.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Behavioral Patterns</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Tab Switches: {selectedStudent.tabSwitches}</div>
                    <div>Face Missing: {selectedStudent.faceMissingCount}</div>
                    <div>Gaze Away: {selectedStudent.gazeAwayCount}</div>
                    <div>Audio Issues: {selectedStudent.audioIssues}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProctoringDashboard;
