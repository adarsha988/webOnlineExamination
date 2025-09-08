import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  BarChart3, 
  ArrowLeft,
  Download,
  Share2,
  Target,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { studentExamAPI, studentAnalyticsAPI } from '@/api/studentExams';

const ExamResult = () => {
  const { id: examId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [comparative, setComparative] = useState(null);

  useEffect(() => {
    if (user && examId) {
      fetchExamResult();
    }
  }, [user, examId]);

  const fetchExamResult = async () => {
    try {
      setLoading(true);
      
      const [resultRes, comparativeRes] = await Promise.all([
        studentExamAPI.getExamResult(examId, user.email),
        studentAnalyticsAPI.getComparativeAnalysis(user._id, examId).catch(() => null)
      ]);

      setResult(resultRes.data);
      
      // Check if results should be hidden
      if (resultRes.showResults === false) {
        toast({
          title: "Keep Trying!",
          description: resultRes.data.message || "Results are not available for this exam.",
          variant: "default",
        });
      }
      setComparative(comparativeRes?.data);

    } catch (error) {
      console.error('Error fetching exam result:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load exam result",
        variant: "destructive",
      });
      setLocation('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      case 'F':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { message: "Outstanding performance! 🎉", color: "text-green-600" };
    if (percentage >= 80) return { message: "Excellent work! 👏", color: "text-green-600" };
    if (percentage >= 70) return { message: "Good job! 👍", color: "text-blue-600" };
    if (percentage >= 60) return { message: "Well done! 😊", color: "text-blue-600" };
    if (percentage >= 40) return { message: "Keep practicing! 💪", color: "text-yellow-600" };
    return { message: "Don't give up! Study more and try again. 📚", color: "text-red-600" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeTaken = () => {
    if (!result.startedAt || !result.submittedAt) return 'N/A';
    
    const start = new Date(result.startedAt);
    const end = new Date(result.submittedAt);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Result Not Available</h2>
            <p className="text-gray-600 mb-4">The exam result is not yet published or not found.</p>
            <Button onClick={() => setLocation('/student/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performance = getPerformanceMessage(result.percentage || 0);
  const correctAnswers = result.answers?.filter(a => a.isCorrect).length || 0;
  const totalQuestions = result.answers?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/student/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Result</h1>
            <p className="text-gray-600">{result.examId?.title}</p>
          </div>
        </div>

        {/* Main Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {result.percentage >= 40 ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl mb-2">
                {result.percentage >= 40 ? 'Congratulations!' : 'Keep Trying!'}
              </CardTitle>
              <CardDescription className={`text-lg font-medium ${performance.color}`}>
                {performance.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {result.score || 0}/{result.examId?.totalMarks || 0}
                  </div>
                  <p className="text-gray-600">Score</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {result.percentage || 0}%
                  </div>
                  <p className="text-gray-600">Percentage</p>
                </div>
                <div>
                  <Badge className={`text-2xl px-4 py-2 ${getGradeColor(result.grade)}`}>
                    {result.grade || 'N/A'}
                  </Badge>
                  <p className="text-gray-600 mt-2">Grade</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{result.percentage || 0}%</span>
                </div>
                <Progress value={result.percentage || 0} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Taken</p>
                    <p className="text-2xl font-bold text-blue-600">{calculateTimeTaken()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subject</p>
                    <p className="text-lg font-bold text-purple-600">
                      {result.examId?.subject || 'N/A'}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={result.percentage >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {result.percentage >= 40 ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>


        {/* Exam Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Exam Title:</span>
                  <span className="ml-2">{result.examId?.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Subject:</span>
                  <span className="ml-2">{result.examId?.subject}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Started At:</span>
                  <span className="ml-2">{formatDate(result.startedAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Submitted At:</span>
                  <span className="ml-2">{formatDate(result.submittedAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="ml-2">{result.examId?.duration} minutes</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Questions:</span>
                  <span className="ml-2">{totalQuestions}</span>
                </div>
              </div>
              
              {result.feedback && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructor Feedback:</h4>
                  <p className="text-blue-800">{result.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Button 
            onClick={() => setLocation('/student/analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation('/student/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamResult;
