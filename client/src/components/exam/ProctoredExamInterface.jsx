import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Mic, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Send,
  Maximize,
  AlertCircle
} from 'lucide-react';
import { useAIProctoring } from '@/hooks/useAIProctoring';

const ProctoredExamInterface = ({ 
  exam, 
  questions, 
  onSubmit, 
  onAnswerChange, 
  answers = {},
  attemptId 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exam.duration * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [examStartTime] = useState(Date.now());
  
  const timerRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Initialize AI Proctoring
  const {
    isInitialized,
    isMonitoring,
    violations,
    tabSwitchCount,
    videoRef,
    startMonitoring,
    stopMonitoring,
    logViolation
  } = useAIProctoring(attemptId, handleViolation);

  // Handle violations
  function handleViolation(violation, result) {
    setViolationCount(prev => prev + 1);
    
    // Show warning for certain violations
    const warningEvents = ['tab_switch', 'window_blur', 'gaze_away', 'copy_paste'];
    if (warningEvents.includes(violation.eventType)) {
      showWarning(violation);
    }
    
    // Critical violations
    const criticalEvents = ['multiple_faces', 'face_mismatch', 'dev_tools_open'];
    if (criticalEvents.includes(violation.eventType)) {
      toast.error(`Critical Violation: ${violation.description}`);
      setShowViolationAlert(true);
    }
    
    // Auto-submit on excessive violations
    if (result.terminated) {
      toast.error('Exam terminated due to excessive violations');
      handleForceSubmit();
    }
  }

  // Show violation warning
  const showWarning = (violation) => {
    const warningMessage = {
      tab_switch: 'Warning: Do not switch tabs during the exam',
      window_blur: 'Warning: Keep the exam window focused',
      gaze_away: 'Warning: Please look at the screen',
      copy_paste: 'Warning: Copy-paste is not allowed'
    };
    
    const warning = {
      id: Date.now(),
      message: warningMessage[violation.eventType] || 'Violation detected',
      type: violation.severity
    };
    
    setWarnings(prev => [...prev, warning]);
    
    // Auto-remove warning after 5 seconds
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w.id !== warning.id));
    }, 5000);
  };

  // Timer countdown
  useEffect(() => {
    sessionStorage.setItem('examStartTime', examStartTime);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStartTime]);

  // Start proctoring when component mounts
  useEffect(() => {
    const initProctoring = async () => {
      const started = await startMonitoring();
      if (!started) {
        toast.error('Failed to initialize proctoring. Please check camera and microphone permissions.');
      }
    };
    
    initProctoring();
    
    // Listen for force submit events
    const handleForceSubmitEvent = () => {
      handleForceSubmit();
    };
    
    window.addEventListener('forceSubmitExam', handleForceSubmitEvent);
    
    return () => {
      stopMonitoring();
      window.removeEventListener('forceSubmitExam', handleForceSubmitEvent);
    };
  }, [startMonitoring, stopMonitoring]);

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer change
  const handleAnswerChange = (questionIndex, answer) => {
    onAnswerChange(questionIndex, answer);
    
    // Log answer change for behavioral analysis
    logViolation('answer_change', 'info', 'Answer modified', {
      behaviorData: {
        questionIndex,
        timeSpentOnQuestion: Date.now() - (sessionStorage.getItem(`question_${questionIndex}_start`) || Date.now()),
        answerLength: answer.length
      }
    });
  };

  // Navigate between questions
  const goToQuestion = (index) => {
    sessionStorage.setItem(`question_${currentQuestion}_end`, Date.now());
    sessionStorage.setItem(`question_${index}_start`, Date.now());
    setCurrentQuestion(index);
  };

  // Auto-submit when time runs out
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    logViolation('auto_submit', 'info', 'Exam auto-submitted due to time limit');
    
    try {
      await onSubmit(answers, 'auto_submitted');
      toast.success('Exam submitted automatically');
    } catch (error) {
      toast.error('Failed to submit exam');
    }
  };

  // Force submit due to violations
  const handleForceSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    logViolation('force_submit', 'critical', 'Exam force-submitted due to violations');
    
    try {
      await onSubmit(answers, 'terminated');
      toast.error('Exam terminated due to policy violations');
    } catch (error) {
      toast.error('Failed to submit exam');
    }
  };

  // Manual submit
  const handleManualSubmit = async () => {
    if (isSubmitting) return;
    
    const confirmSubmit = window.confirm('Are you sure you want to submit your exam? This action cannot be undone.');
    if (!confirmSubmit) return;
    
    setIsSubmitting(true);
    logViolation('manual_submit', 'info', 'Exam manually submitted by student');
    
    try {
      await onSubmit(answers, 'submitted');
      toast.success('Exam submitted successfully');
    } catch (error) {
      toast.error('Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const timeProgress = ((exam.duration * 60 - timeRemaining) / (exam.duration * 60)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Proctoring Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isMonitoring ? 'success' : 'destructive'} className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {isMonitoring ? 'Proctoring Active' : 'Proctoring Inactive'}
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Camera className="h-4 w-4" />
                <span>Camera: {isInitialized ? 'Active' : 'Inactive'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>Violations: {violationCount}</span>
              </div>
              
              {tabSwitchCount > 0 && (
                <Badge variant="warning">
                  Tab Switches: {tabSwitchCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Button 
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden video element for proctoring */}
      <video
        ref={videoRef}
        className="hidden"
        width="640"
        height="480"
        autoPlay
        muted
      />

      {/* Violation Warnings */}
      <AnimatePresence>
        {warnings.map((warning) => (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 right-4 z-40"
          >
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {warning.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Critical Violation Alert */}
      {showViolationAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <Card className="max-w-md mx-4 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Violation Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                A serious violation has been detected. Please ensure you are following all exam guidelines.
                Continued violations may result in automatic exam termination.
              </p>
              <Button 
                onClick={() => setShowViolationAlert(false)}
                className="w-full"
              >
                I Understand
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Exam Content */}
      <div className="max-w-4xl mx-auto pt-20 pb-8">
        {/* Progress Indicators */}
        <div className="mb-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question Progress</span>
              <span>{currentQuestion + 1} of {questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Time Progress</span>
              <span>{Math.round(timeProgress)}%</span>
            </div>
            <Progress value={timeProgress} className="h-2" />
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestion ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToQuestion(index)}
                className={`w-10 h-10 ${
                  answers[index] ? 'bg-green-100 border-green-300' : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestion + 1}</span>
              <Badge variant="outline">
                {currentQuestionData.marks} marks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">{currentQuestionData.text}</p>
              
              {currentQuestionData.type === 'multiple_choice' ? (
                <div className="space-y-2">
                  {currentQuestionData.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={option}
                        checked={answers[currentQuestion] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                        className="text-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => goToQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={() => goToQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProctoredExamInterface;
