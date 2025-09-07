import React, { useState, useEffect } from 'react';
import { 
  Trophy, Clock, Eye, AlertTriangle, CheckCircle, XCircle, 
  TrendingUp, TrendingDown, BarChart3, PieChart, Download,
  Shield, Camera, Mic, Brain, Target, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ResultsDashboard = ({ attemptId, userRole = 'student' }) => {
  const [results, setResults] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [proctoringDetails, setProctoringDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchResults();
    if (userRole === 'instructor') {
      fetchDetailedAnalytics();
    }
  }, [attemptId, userRole]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/results/attempt/${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setResults(data.results);
      
      if (userRole === 'instructor') {
        fetchProctoringDetails();
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedAnalytics = async () => {
    try {
      const response = await fetch(`/api/results/student/${results?.student?._id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchProctoringDetails = async () => {
    try {
      const response = await fetch(`/api/proctoring/violations/${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setProctoringDetails(data);
    } catch (error) {
      console.error('Error fetching proctoring details:', error);
    }
  };

  const exportResults = async (format = 'pdf') => {
    try {
      const response = await fetch(`/api/results/exam/${results.exam._id}/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${results.exam.title}_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Results Not Available</h2>
          <p className="text-gray-600">The results for this exam are not yet available.</p>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'text-green-600 bg-green-100',
      'A': 'text-green-600 bg-green-100',
      'A-': 'text-green-600 bg-green-100',
      'B+': 'text-blue-600 bg-blue-100',
      'B': 'text-blue-600 bg-blue-100',
      'B-': 'text-blue-600 bg-blue-100',
      'C+': 'text-yellow-600 bg-yellow-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'C-': 'text-yellow-600 bg-yellow-100',
      'D+': 'text-orange-600 bg-orange-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100'
    };
    return gradeColors[grade] || 'text-gray-600 bg-gray-100';
  };

  const getIntegrityColor = (rating) => {
    const colors = {
      'high': 'text-green-600 bg-green-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'low': 'text-orange-600 bg-orange-100',
      'compromised': 'text-red-600 bg-red-100'
    };
    return colors[rating] || 'text-gray-600 bg-gray-100';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Final Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.attempt.score}/{results.exam.totalMarks}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(results.attempt.grade)}`}>
                Grade: {results.attempt.grade}
              </span>
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
              <p className="text-sm font-medium text-gray-600">Percentage</p>
              <p className="text-2xl font-bold text-gray-900">{results.attempt.percentage}%</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${results.performance.passed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${results.attempt.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {results.performance.passed ? 'Passed' : 'Failed'} (Required: {(results.exam.passingMarks / results.exam.totalMarks * 100).toFixed(1)}%)
            </p>
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
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(results.attempt.timeSpent / 60)}m {results.attempt.timeSpent % 60}s
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Efficiency: {((results.attempt.timeSpent / (results.exam.duration * 60)) * 100).toFixed(1)}%
            </p>
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
              <p className="text-sm font-medium text-gray-600">Integrity Rating</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {results.proctoring.integrityRating}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntegrityColor(results.proctoring.integrityRating)}`}>
              Suspicion Score: {results.proctoring.suspicionScore}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Correct Answers</span>
              <span className="font-medium">
                {results.analytics.performanceAnalysis.correctAnswers} / {results.analytics.performanceAnalysis.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Accuracy Rate</span>
              <span className="font-medium">{results.analytics.performanceAnalysis.accuracyRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Time per Question</span>
              <span className="font-medium">
                {Math.floor(results.analytics.timeAnalysis.averageTimePerQuestion / 60)}m {Math.floor(results.analytics.timeAnalysis.averageTimePerQuestion % 60)}s
              </span>
            </div>
          </div>

          {/* Time Distribution Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Time Distribution by Question</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.analytics.timeAnalysis.timeDistribution.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="questionId" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value) => [`${Math.floor(value / 60)}m ${Math.floor(value % 60)}s`, 'Time Spent']} />
                <Bar dataKey="timeSpent" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Proctoring Analysis</h3>
          
          {/* AI Insights */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-5 h-5 text-purple-500" />
              <h4 className="font-medium">AI Assessment</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Recommendation:</strong> {results.analytics.proctoringAnalysis.aiRecommendation}
              </p>
              <p className="text-sm text-gray-600">
                Based on behavioral patterns and violation analysis, this attempt shows 
                {results.proctoring.suspicionScore < 25 ? ' normal exam behavior' : 
                 results.proctoring.suspicionScore < 50 ? ' some irregular patterns' : 
                 ' significant anomalies that require review'}.
              </p>
            </div>
          </div>

          {/* Violation Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Violations</span>
              <span className="font-medium">{results.proctoring.violationCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Critical Violations</span>
              <span className={`font-medium ${results.proctoring.criticalViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {results.proctoring.criticalViolations}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Integrity Score</span>
              <span className="font-medium">{100 - results.proctoring.suspicionScore}%</span>
            </div>
          </div>

          {/* Violation Types Chart */}
          {proctoringDetails?.violationBreakdown && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Violation Types</h4>
              <ResponsiveContainer width="100%" height={150}>
                <RechartsPieChart>
                  <Pie
                    data={proctoringDetails.violationBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ eventType, count }) => `${eventType}: ${count}`}
                  >
                    {proctoringDetails.violationBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Exam Information */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Exam Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Exam Title</p>
            <p className="font-medium">{results.exam.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subject</p>
            <p className="font-medium">{results.exam.subject}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-medium">{results.exam.duration} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Started At</p>
            <p className="font-medium">{new Date(results.attempt.startedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Submitted At</p>
            <p className="font-medium">{new Date(results.attempt.submittedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              results.attempt.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {results.attempt.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnswersTab = () => (
    <div className="space-y-6">
      {results.answers ? (
        results.answers.map((answer, index) => (
          <motion.div
            key={answer.questionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm border"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Question {index + 1}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {answer.marksObtained}/{answer.question.marks} marks
                </span>
                {answer.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-800 mb-2">{answer.question.content}</p>
              {answer.question.options && (
                <div className="space-y-1 mb-4">
                  {answer.question.options.map((option, optIndex) => (
                    <div key={optIndex} className={`p-2 rounded text-sm ${
                      option.text === answer.correctAnswer ? 'bg-green-100 text-green-800' :
                      option.text === answer.userAnswer ? 'bg-red-100 text-red-800' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {String.fromCharCode(65 + optIndex)}. {option.text}
                      {option.text === answer.correctAnswer && <span className="ml-2 font-medium">(Correct)</span>}
                      {option.text === answer.userAnswer && option.text !== answer.correctAnswer && 
                        <span className="ml-2 font-medium">(Your Answer)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{answer.userAnswer || 'No answer provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                <p className="text-sm bg-green-50 p-2 rounded">{answer.correctAnswer}</p>
              </div>
            </div>

            {answer.explanation && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">{answer.explanation}</p>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span>Time spent: {Math.floor(answer.timeSpent / 60)}m {answer.timeSpent % 60}s</span>
              {answer.flagged && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Flagged: {answer.flagReason}
                </span>
              )}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Answer details are not available for this exam.</p>
        </div>
      )}
    </div>
  );

  const renderProctoringTab = () => (
    <div className="space-y-6">
      {userRole === 'instructor' && results.proctoringLogs ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Proctoring Timeline</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.proctoringLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  log.severity === 'critical' ? 'bg-red-500' :
                  log.severity === 'high' ? 'bg-orange-500' :
                  log.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{log.eventType.replace('_', ' ').toUpperCase()}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                    log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    log.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Proctoring Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Camera className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Face Detection</p>
              <p className="text-xs text-gray-600">Monitored throughout exam</p>
            </div>
            <div className="text-center">
              <Mic className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Audio Monitoring</p>
              <p className="text-xs text-gray-600">Background noise analyzed</p>
            </div>
            <div className="text-center">
              <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Gaze Tracking</p>
              <p className="text-xs text-gray-600">Attention patterns recorded</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
              <p className="text-gray-600">{results.exam.title} - {results.exam.subject}</p>
              {userRole === 'instructor' && (
                <p className="text-sm text-gray-500">
                  Student: {results.student.name} ({results.student.email})
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {results.performance.passed ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">PASSED</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <XCircle className="w-6 h-6" />
                  <span className="font-medium">FAILED</span>
                </div>
              )}
              
              {userRole === 'instructor' && (
                <button
                  onClick={() => exportResults('csv')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {['overview', 'answers', 'proctoring'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'answers' && renderAnswersTab()}
        {activeTab === 'proctoring' && renderProctoringTab()}
      </div>
    </div>
  );
};

export default ResultsDashboard;
