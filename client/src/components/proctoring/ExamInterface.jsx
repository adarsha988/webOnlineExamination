import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, AlertTriangle, Clock, Save, Send, Eye, EyeOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExamInterface = ({ exam, attempt, onSubmitExam, onSaveAnswer }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(attempt?.timing?.timeRemaining || exam.duration * 60);
  const [proctoringStatus, setProctoringStatus] = useState({
    faceDetected: true,
    gazeTracking: true,
    audioMonitoring: true,
    suspicionScore: 0,
    violations: []
  });
  const [warnings, setWarnings] = useState([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [proctoringLogs, setProctoringLogs] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const proctoringIntervalRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const gazeTrackingRef = useRef(null);

  // Initialize proctoring
  useEffect(() => {
    initializeProctoring();
    startAutoSave();
    startTimer();

    return () => {
      cleanup();
    };
  }, []);

  // Monitor tab visibility and window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab_switch', 'medium', 'Tab switched or window minimized');
      }
    };

    const handleWindowBlur = () => {
      reportViolation('window_blur', 'medium', 'Window lost focus');
    };

    const handleWindowFocus = () => {
      logEvent('window_focus', 'info', 'Window regained focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportViolation('right_click', 'low', 'Right-click attempted');
    };

    const handleKeyDown = (e) => {
      // Block common shortcuts
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['c', 'v', 'x', 'a', 's', 'p', 'f', 'u', 'i'];
        if (blockedKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          reportViolation('keyboard_shortcut', 'medium', `Blocked shortcut: ${e.key}`);
        }
      }

      // Block F12 (dev tools)
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('dev_tools', 'high', 'Developer tools access attempted');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initializeProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start proctoring monitoring
      proctoringIntervalRef.current = setInterval(() => {
        performProctoringChecks();
      }, 2000); // Check every 2 seconds

      // Start gaze tracking
      startGazeTracking();

    } catch (error) {
      console.error('Failed to initialize proctoring:', error);
      reportViolation('camera_access_failed', 'critical', 'Failed to access camera');
    }
  };

  const performProctoringChecks = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // Face detection
      await detectFace();
      
      // Audio monitoring
      await monitorAudio();
      
      // Update proctoring status
      await fetchProctoringStatus();
    } catch (error) {
      console.error('Proctoring check error:', error);
    }
  };

  const detectFace = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simulate face detection (in real implementation, use AI service)
    const faceDetected = Math.random() > 0.1; // 90% chance of face detection
    const multipleFaces = Math.random() > 0.95; // 5% chance of multiple faces

    if (!faceDetected) {
      reportViolation('no_face', 'high', 'No face detected in camera');
      setProctoringStatus(prev => ({ ...prev, faceDetected: false }));
    } else if (multipleFaces) {
      reportViolation('multiple_faces', 'critical', 'Multiple faces detected');
      setProctoringStatus(prev => ({ ...prev, faceDetected: false }));
    } else {
      setProctoringStatus(prev => ({ ...prev, faceDetected: true }));
    }
  };

  const monitorAudio = async () => {
    // Simulate audio monitoring
    const suspiciousAudio = Math.random() > 0.98; // 2% chance of suspicious audio
    const multipleVoices = Math.random() > 0.99; // 1% chance of multiple voices

    if (suspiciousAudio) {
      reportViolation('suspicious_audio', 'medium', 'Suspicious audio detected');
    }

    if (multipleVoices) {
      reportViolation('multiple_voices', 'high', 'Multiple voices detected');
    }
  };

  const startGazeTracking = () => {
    // Simulate gaze tracking
    gazeTrackingRef.current = setInterval(() => {
      const gazeAway = Math.random() > 0.95; // 5% chance of looking away
      
      if (gazeAway) {
        const duration = Math.floor(Math.random() * 10) + 1; // 1-10 seconds
        if (duration > 3) {
          reportViolation('gaze_away', duration > 7 ? 'high' : 'medium', 
            `Looked away for ${duration} seconds`);
        }
      }
    }, 5000); // Check every 5 seconds
  };

  const reportViolation = async (type, severity, description) => {
    try {
      const response = await fetch('/api/proctoring/log-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attemptId: attempt._id,
          eventType: type,
          severity,
          description,
          questionId: exam.questions[currentQuestion]?.questionId,
          questionNumber: currentQuestion + 1,
          timeIntoExam: (exam.duration * 60) - timeRemaining,
          timeRemainingInExam: timeRemaining
        })
      });

      const result = await response.json();
      
      if (result.terminated) {
        alert('Exam terminated due to multiple violations');
        onSubmitExam(true); // Force submit
      } else if (result.suspicionScore > 25) {
        setWarnings(prev => [...prev, {
          id: Date.now(),
          message: `Warning: ${description}`,
          severity,
          timestamp: new Date()
        }]);
      }

      setProctoringStatus(prev => ({
        ...prev,
        suspicionScore: result.suspicionScore,
        violations: [...prev.violations, { type, severity, description, timestamp: new Date() }]
      }));

    } catch (error) {
      console.error('Failed to report violation:', error);
    }
  };

  const logEvent = async (type, severity, description) => {
    try {
      await fetch('/api/proctoring/log-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attemptId: attempt._id,
          eventType: type,
          severity,
          description,
          questionId: exam.questions[currentQuestion]?.questionId,
          questionNumber: currentQuestion + 1,
          timeIntoExam: (exam.duration * 60) - timeRemaining,
          timeRemainingInExam: timeRemaining
        })
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  const fetchProctoringStatus = async () => {
    try {
      const response = await fetch(`/api/proctoring/status/${attempt._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setProctoringLogs(data.recentActivity || []);
      
      if (data.warnings?.showWarning) {
        setWarnings(prev => [...prev, {
          id: Date.now(),
          message: data.warnings.message,
          severity: data.warnings.warningLevel,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch proctoring status:', error);
    }
  };

  const startAutoSave = () => {
    autoSaveIntervalRef.current = setInterval(() => {
      autoSaveAnswers();
    }, 30000); // Auto-save every 30 seconds
  };

  const autoSaveAnswers = async () => {
    if (Object.keys(answers).length === 0) return;

    setIsAutoSaving(true);
    try {
      for (const [questionId, answer] of Object.entries(answers)) {
        await onSaveAnswer(questionId, answer);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const startTimer = () => {
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          onSubmitExam(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  };

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (proctoringIntervalRef.current) {
      clearInterval(proctoringIntervalRef.current);
    }
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    if (gazeTrackingRef.current) {
      clearInterval(gazeTrackingRef.current);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
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

  const dismissWarning = (warningId) => {
    setWarnings(prev => prev.filter(w => w.id !== warningId));
  };

  const renderQuestion = () => {
    const question = exam.questions[currentQuestion];
    if (!question) return null;

    const questionId = question.questionId || question._id;
    const currentAnswer = answers[questionId] || '';

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">
              Question {currentQuestion + 1} of {exam.questions.length}
            </h3>
            <span className="text-sm text-gray-500">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-800 leading-relaxed">{question.content || question.title}</p>
          </div>

          {question.type === 'mcq' && (
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${questionId}`}
                    value={option.text}
                    checked={currentAnswer === option.text}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    className="text-blue-600"
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'short' && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder="Enter your answer here..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          )}

          {question.type === 'long' && (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder="Enter your detailed answer here..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
            />
          )}

          {question.type === 'true_false' && (
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  className="text-blue-600"
                />
                <span>True</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${questionId}`}
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  className="text-blue-600"
                />
                <span>False</span>
              </label>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => autoSaveAnswers()}
              disabled={isAutoSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isAutoSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {currentQuestion < exam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => onSubmitExam(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                <span>Submit Exam</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{exam.title}</h1>
              <p className="text-sm text-gray-600">{exam.subject}</p>
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Clock className={`w-5 h-5 ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-500'}`} />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Proctoring Status */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Camera className={`w-4 h-4 ${proctoringStatus.faceDetected ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-xs">Camera</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mic className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Audio</span>
                </div>
                {proctoringStatus.suspicionScore > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs">Score: {proctoringStatus.suspicionScore}</span>
                  </div>
                )}
              </div>

              {/* Auto-save indicator */}
              <div className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.map(warning => (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`
              fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
              ${warning.severity === 'critical' ? 'bg-red-500 text-white' : 
                warning.severity === 'high' ? 'bg-orange-500 text-white' : 
                'bg-yellow-500 text-black'}
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Proctoring Alert</p>
                <p className="text-sm">{warning.message}</p>
              </div>
              <button
                onClick={() => dismissWarning(warning.id)}
                className="ml-2 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderQuestion()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proctoring Monitor */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="font-semibold mb-4">Proctoring Monitor</h3>
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded border"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Face Detection:</span>
                    <span className={proctoringStatus.faceDetected ? 'text-green-600' : 'text-red-600'}>
                      {proctoringStatus.faceDetected ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrity Score:</span>
                    <span className={`
                      ${proctoringStatus.suspicionScore < 25 ? 'text-green-600' : 
                        proctoringStatus.suspicionScore < 50 ? 'text-yellow-600' : 'text-red-600'}
                    `}>
                      {100 - proctoringStatus.suspicionScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="font-semibold mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`
                      w-8 h-8 rounded text-xs font-medium
                      ${index === currentQuestion 
                        ? 'bg-blue-600 text-white' 
                        : answers[exam.questions[index]?.questionId || exam.questions[index]?._id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {proctoringLogs.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {proctoringLogs.slice(0, 5).map((log, index) => (
                    <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.eventType.replace('_', ' ')}</span>
                        <span className={`
                          ${log.severity === 'critical' ? 'text-red-600' : 
                            log.severity === 'high' ? 'text-orange-600' : 
                            log.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'}
                        `}>
                          {log.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{log.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
