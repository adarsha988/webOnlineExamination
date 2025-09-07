import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Circle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { studentExamAPI } from '@/api/studentExams';

const ExamTaking = () => {
  const { examId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [examSession, setExamSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const visibilityRef = useRef(true);

  // Load exam session
  useEffect(() => {
    if (user && examId) {
      loadExamSession();
    }
  }, [user, examId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  // Auto-save effect
  useEffect(() => {
    if (examSession && Object.keys(answers).length > 0) {
      autoSaveRef.current = setInterval(() => {
        autoSaveAnswers();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [answers, examSession]);

  // Visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && visibilityRef.current) {
        reportViolation('tab_switch', 'Student switched tabs or minimized window');
        visibilityRef.current = false;
      } else if (!document.hidden) {
        visibilityRef.current = true;
      }
    };

    const handleBlur = () => {
      if (visibilityRef.current) {
        reportViolation('window_blur', 'Student switched focus away from exam window');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      reportViolation('right_click', 'Student attempted to right-click');
    };

    const handleKeyDown = (e) => {
      // Prevent common shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        e.preventDefault();
        reportViolation('copy_paste', `Student attempted ${e.key === 'c' ? 'copy' : e.key === 'v' ? 'paste' : 'select all'}`);
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        reportViolation('dev_tools', 'Student attempted to open developer tools');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadExamSession = async () => {
    try {
      setLoading(true);
      const response = await studentExamAPI.getExamSession(examId, user._id);
      
      if (response.success) {
        setExamSession(response.data);
        setTimeRemaining(response.data.timeRemaining);
        
        // Initialize answers from existing session
        const existingAnswers = {};
        response.data.answers.forEach(answer => {
          if (answer.answer !== null && answer.answer !== undefined) {
            existingAnswers[answer.questionId._id || answer.questionId] = answer.answer;
          }
        });
        setAnswers(existingAnswers);
        setLastSavedAt(new Date(response.data.lastSavedAt));
      }
    } catch (error) {
      console.error('Error loading exam session:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load exam session",
        variant: "destructive",
      });
      setLocation('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const autoSaveAnswers = useCallback(async () => {
    if (!examSession || saving) return;
    
    try {
      setSaving(true);
      const currentQuestion = examSession.examId.questions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestion._id];
      
      if (currentAnswer !== undefined) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        await studentExamAPI.saveAnswer(examId, user._id, currentQuestion._id, currentAnswer, timeSpent);
        setLastSavedAt(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [examSession, answers, currentQuestionIndex, examId, user._id, saving, questionStartTime]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleQuestionNavigation = (index) => {
    // Save current question time before switching
    if (examSession) {
      const currentQuestion = examSession.examId.questions[currentQuestionIndex];
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      
      if (answers[currentQuestion._id] !== undefined) {
        studentExamAPI.saveAnswer(examId, user._id, currentQuestion._id, answers[currentQuestion._id], timeSpent);
      }
    }
    
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const handleManualSave = async () => {
    await autoSaveAnswers();
    toast({
      title: "Saved",
      description: "Your answers have been saved successfully.",
    });
  };

  const handleAutoSubmit = async () => {
    try {
      const finalAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timeSpent: 0
      }));

      await studentExamAPI.submitExam(examId, user._id, finalAnswers);
      
      toast({
        title: "Time's Up!",
        description: "Your exam has been automatically submitted.",
        variant: "destructive",
      });
      
      setLocation(`/student/exam/${examId}/result`);
    } catch (error) {
      console.error('Auto-submit failed:', error);
      toast({
        title: "Error",
        description: "Failed to submit exam automatically",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const finalAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timeSpent: Math.floor((Date.now() - questionStartTime) / 1000)
      }));

      const response = await studentExamAPI.submitExam(examId, user._id, finalAnswers);
      
      if (response.success) {
        toast({
          title: "Exam Submitted",
          description: "Your exam has been submitted successfully!",
        });
        setLocation(`/student/exam/${examId}/result`);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit exam",
        variant: "destructive",
      });
    }
  };

  const reportViolation = async (type, details) => {
    try {
      await studentExamAPI.reportViolation(examId, user._id, type, details);
      setViolations(prev => [...prev, { type, details, timestamp: new Date() }]);
    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const question = examSession.examId.questions[index];
    const hasAnswer = answers[question._id] !== undefined && answers[question._id] !== null && answers[question._id] !== '';
    
    if (index === currentQuestionIndex) return 'current';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const renderQuestion = (question) => {
    const answer = answers[question._id];

    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer || ''}
              onValueChange={(value) => handleAnswerChange(question._id, value)}
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'truefalse':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer || ''}
              onValueChange={(value) => handleAnswerChange(question._id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'short':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-[100px]"
          />
        );

      case 'long':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your detailed answer here..."
            className="min-h-[200px]"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Exam Not Available</h2>
            <p className="text-gray-600 mb-4">Unable to load the exam session.</p>
            <Button onClick={() => navigate('/student/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = examSession.examId.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examSession.examId.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(key => 
    answers[key] !== undefined && answers[key] !== null && answers[key] !== ''
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {examSession.examId.title}
              </h1>
              <p className="text-sm text-gray-600">
                {examSession.examId.subject} • Question {currentQuestionIndex + 1} of {examSession.examId.questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-save status */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : 'Not saved'}
                  </>
                )}
              </div>

              {/* Manual save button */}
              <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Submit button */}
              <Button 
                onClick={() => setShowSubmitDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Exam
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {answeredCount}/{examSession.examId.questions.length} answered</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {examSession.examId.questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    return (
                      <Button
                        key={index}
                        variant={status === 'current' ? 'default' : 'outline'}
                        size="sm"
                        className={`h-10 w-10 p-0 ${
                          status === 'answered' ? 'bg-green-100 border-green-300 text-green-700' :
                          status === 'current' ? 'bg-blue-600 text-white' :
                          'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => handleQuestionNavigation(index)}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                    <span>Not answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {currentQuestion.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                      </Badge>
                      {currentQuestion.difficulty && (
                        <Badge variant="outline" className={
                          currentQuestion.difficulty === 'easy' ? 'text-green-600' :
                          currentQuestion.difficulty === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {currentQuestion.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div className="prose max-w-none">
                  <p className="text-gray-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>

                {/* Answer Area */}
                <div className="border-t pt-6">
                  {renderQuestion(currentQuestion)}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleQuestionNavigation(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleQuestionNavigation(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === examSession.examId.questions.length - 1}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your exam? You have answered {answeredCount} out of {examSession.examId.questions.length} questions.
              {answeredCount < examSession.examId.questions.length && (
                <span className="text-orange-600 font-medium">
                  <br />Warning: You have {examSession.examId.questions.length - answeredCount} unanswered questions.
                </span>
              )}
              <br /><br />
              Once submitted, you cannot make any changes to your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExamTaking;
