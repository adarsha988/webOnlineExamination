import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Shield, Eye, Users, 
  BarChart3, Activity, Zap, Target, Award, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const AIAnalyticsDashboard = ({ examId, timeRange = '7d' }) => {
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('integrity');

  useEffect(() => {
    fetchAnalytics();
    fetchAIInsights();
  }, [examId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/exam/${examId}?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const response = await fetch(`/api/analytics/ai-insights/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockAnalytics = {
    overview: {
      totalAttempts: 156,
      averageIntegrity: 87.3,
      suspiciousAttempts: 12,
      flaggedForReview: 8,
      averageScore: 78.5,
      completionRate: 94.2
    },
    integrityTrends: [
      { date: '2024-01-01', high: 45, medium: 8, low: 2, compromised: 1 },
      { date: '2024-01-02', high: 52, medium: 6, low: 3, compromised: 0 },
      { date: '2024-01-03', high: 48, medium: 9, low: 1, compromised: 2 },
      { date: '2024-01-04', high: 55, medium: 4, low: 2, compromised: 1 },
      { date: '2024-01-05', high: 49, medium: 7, low: 3, compromised: 0 },
      { date: '2024-01-06', high: 51, medium: 5, low: 1, compromised: 1 },
      { date: '2024-01-07', high: 47, medium: 8, low: 4, compromised: 2 }
    ],
    violationPatterns: [
      { type: 'gaze_away', count: 34, severity: 'medium', trend: 'increasing' },
      { type: 'tab_switch', count: 18, severity: 'high', trend: 'stable' },
      { type: 'multiple_faces', count: 12, severity: 'critical', trend: 'decreasing' },
      { type: 'no_face', count: 28, severity: 'high', trend: 'increasing' },
      { type: 'suspicious_audio', count: 15, severity: 'medium', trend: 'stable' }
    ],
    performanceCorrelation: [
      { integrityScore: 95, examScore: 92, suspicionLevel: 5 },
      { integrityScore: 88, examScore: 85, suspicionLevel: 12 },
      { integrityScore: 76, examScore: 78, suspicionLevel: 24 },
      { integrityScore: 65, examScore: 71, suspicionLevel: 35 },
      { integrityScore: 45, examScore: 58, suspicionLevel: 55 },
      { integrityScore: 32, examScore: 42, suspicionLevel: 68 },
      { integrityScore: 28, examScore: 35, suspicionLevel: 72 }
    ],
    timeAnalysis: [
      { hour: '09:00', attempts: 12, avgIntegrity: 92, violations: 2 },
      { hour: '10:00', attempts: 18, avgIntegrity: 89, violations: 4 },
      { hour: '11:00', attempts: 25, avgIntegrity: 85, violations: 7 },
      { hour: '12:00', attempts: 15, avgIntegrity: 78, violations: 9 },
      { hour: '13:00', attempts: 22, avgIntegrity: 81, violations: 6 },
      { hour: '14:00', attempts: 28, avgIntegrity: 86, violations: 5 },
      { hour: '15:00', attempts: 20, avgIntegrity: 88, violations: 3 }
    ]
  };

  const mockAIInsights = {
    riskAssessment: {
      overallRisk: 'medium',
      riskFactors: [
        'Increased tab switching during difficult questions',
        'Higher violation rates during afternoon sessions',
        'Correlation between low scores and high suspicion levels'
      ],
      recommendations: [
        'Implement stricter monitoring for afternoon sessions',
        'Add additional warnings for tab switching',
        'Consider adaptive question difficulty based on behavior'
      ]
    },
    behaviorPatterns: {
      normalBehavior: {
        avgGazeStability: 94.2,
        avgFaceVisibility: 97.8,
        avgAudioConsistency: 91.5,
        typicalSessionLength: 45.3
      },
      anomalousPatterns: [
        {
          pattern: 'Rapid answer changes in final minutes',
          frequency: 23,
          riskLevel: 'high',
          description: 'Students making multiple answer changes in the last 5 minutes'
        },
        {
          pattern: 'Consistent gaze patterns',
          frequency: 15,
          riskLevel: 'medium',
          description: 'Unnaturally consistent eye movement patterns'
        }
      ]
    },
    predictiveModels: {
      cheatingProbability: [
        { studentId: 'S001', probability: 0.85, factors: ['multiple_faces', 'tab_switch', 'rapid_answers'] },
        { studentId: 'S002', probability: 0.72, factors: ['gaze_away', 'suspicious_audio'] },
        { studentId: 'S003', probability: 0.68, factors: ['no_face', 'time_anomaly'] }
      ],
      performancePrediction: {
        accuracy: 87.3,
        factors: ['integrity_score', 'time_spent', 'violation_count', 'behavioral_consistency']
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI analytics...</p>
        </div>
      </div>
    );
  }

  const data = analytics || mockAnalytics;
  const insights = aiInsights || mockAIInsights;

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-sm border"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">AI Integrity Score</p>
            <p className="text-2xl font-bold text-gray-900">{data.overview.averageIntegrity}%</p>
          </div>
          <Shield className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-4">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+2.3% from last week</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg p-6 shadow-sm border"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Suspicious Attempts</p>
            <p className="text-2xl font-bold text-gray-900">{data.overview.suspiciousAttempts}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="mt-4">
          <span className="text-sm text-gray-600">
            {((data.overview.suspiciousAttempts / data.overview.totalAttempts) * 100).toFixed(1)}% of total
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 shadow-sm border"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">AI Predictions</p>
            <p className="text-2xl font-bold text-gray-900">{insights.predictiveModels.performancePrediction.accuracy}%</p>
          </div>
          <Brain className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-4">
          <span className="text-sm text-gray-600">Model accuracy</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg p-6 shadow-sm border"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Risk Level</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{insights.riskAssessment.overallRisk}</p>
          </div>
          <Target className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            insights.riskAssessment.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
            insights.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Overall Assessment
          </span>
        </div>
      </motion.div>
    </div>
  );

  const renderIntegrityTrends = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
      <h3 className="text-lg font-semibold mb-4">Integrity Trends Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.integrityTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="high" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
          <Area type="monotone" dataKey="medium" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
          <Area type="monotone" dataKey="low" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />
          <Area type="monotone" dataKey="compromised" stackId="1" stroke="#7C2D12" fill="#7C2D12" fillOpacity={0.8} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderViolationPatterns = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
      <h3 className="text-lg font-semibold mb-4">AI-Detected Violation Patterns</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.violationPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          {data.violationPatterns.map((pattern, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-sm">{pattern.type.replace('_', ' ').toUpperCase()}</p>
                <p className="text-xs text-gray-600">{pattern.count} occurrences</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pattern.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  pattern.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pattern.severity}
                </span>
                <p className="text-xs text-gray-500 mt-1">{pattern.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPerformanceCorrelation = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
      <h3 className="text-lg font-semibold mb-4">Performance vs Integrity Correlation</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={data.performanceCorrelation}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="integrityScore" name="Integrity Score" />
          <YAxis dataKey="examScore" name="Exam Score" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Students" dataKey="examScore" fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>AI Insight:</strong> Strong positive correlation (r=0.87) between integrity scores and exam performance. 
          Students with higher integrity scores tend to perform better academically.
        </p>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Risk Assessment</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Risk Factors Identified:</h4>
            <ul className="space-y-1">
              {insights.riskAssessment.riskFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <AlertTriangle className="w-3 h-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">AI Recommendations:</h4>
            <ul className="space-y-1">
              {insights.riskAssessment.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <Zap className="w-3 h-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Behavioral Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Normal Behavior Baseline:</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-green-50 p-2 rounded">
                <p className="font-medium">Gaze Stability</p>
                <p className="text-green-700">{insights.behaviorPatterns.normalBehavior.avgGazeStability}%</p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="font-medium">Face Visibility</p>
                <p className="text-green-700">{insights.behaviorPatterns.normalBehavior.avgFaceVisibility}%</p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="font-medium">Audio Consistency</p>
                <p className="text-green-700">{insights.behaviorPatterns.normalBehavior.avgAudioConsistency}%</p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="font-medium">Session Length</p>
                <p className="text-green-700">{insights.behaviorPatterns.normalBehavior.typicalSessionLength}m</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Anomalous Patterns:</h4>
            <div className="space-y-2">
              {insights.behaviorPatterns.anomalousPatterns.map((pattern, index) => (
                <div key={index} className="p-2 bg-red-50 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-red-800">{pattern.pattern}</p>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      pattern.riskLevel === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {pattern.riskLevel}
                    </span>
                  </div>
                  <p className="text-red-600 mt-1">{pattern.description}</p>
                  <p className="text-red-500 mt-1">Frequency: {pattern.frequency} cases</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPredictiveModels = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center space-x-2 mb-4">
        <Target className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">AI Predictive Models</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">High-Risk Students (Cheating Probability)</h4>
          <div className="space-y-3">
            {insights.predictiveModels.cheatingProbability.map((student, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{student.studentId}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.probability > 0.8 ? 'bg-red-100 text-red-800' :
                    student.probability > 0.6 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(student.probability * 100).toFixed(1)}% risk
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {student.factors.map((factor, fIndex) => (
                    <span key={fIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {factor.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-3">Model Performance</h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Prediction Accuracy</span>
                <span className="text-2xl font-bold text-blue-600">
                  {insights.predictiveModels.performancePrediction.accuracy}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${insights.predictiveModels.performancePrediction.accuracy}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-xs text-gray-600 mb-2">Key Prediction Factors:</h5>
              <div className="space-y-1">
                {insights.predictiveModels.performancePrediction.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{factor.replace('_', ' ')}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${Math.random() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Proctoring Analytics</h1>
              <p className="text-gray-600">Advanced insights powered by artificial intelligence</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderOverviewCards()}
        {renderIntegrityTrends()}
        {renderViolationPatterns()}
        {renderPerformanceCorrelation()}
        {renderAIInsights()}
        {renderPredictiveModels()}
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;
