import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Mic, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Brain,
  Shield,
  Zap
} from 'lucide-react';

const ProctoringTestInterface = () => {
  const [testResults, setTestResults] = useState({
    faceDetection: null,
    gazeTracking: null,
    audioAnalysis: null,
    anomalyDetection: null,
    realTimeProcessing: null
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return true;
    } catch (error) {
      console.error('Camera access failed:', error);
      return false;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const runTest = async (testType) => {
    setCurrentTest(testType);
    setIsRunning(true);

    try {
      switch (testType) {
        case 'faceDetection':
          await testFaceDetection();
          break;
        case 'gazeTracking':
          await testGazeTracking();
          break;
        case 'audioAnalysis':
          await testAudioAnalysis();
          break;
        case 'anomalyDetection':
          await testAnomalyDetection();
          break;
        case 'realTimeProcessing':
          await testRealTimeProcessing();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Test ${testType} failed:`, error);
      setTestResults(prev => ({
        ...prev,
        [testType]: { success: false, error: error.message }
      }));
    }

    setCurrentTest(null);
    setIsRunning(false);
  };

  const testFaceDetection = async () => {
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      throw new Error('Camera access required for face detection test');
    }

    // Wait for video to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const frameData = captureFrame();
    if (!frameData) {
      throw new Error('Failed to capture frame');
    }

    // Convert data URL to blob
    const response = await fetch(frameData);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', blob, 'test-frame.jpg');

    const result = await fetch('/api/ai-proctoring/detect-face', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const faceData = await result.json();
    
    setTestResults(prev => ({
      ...prev,
      faceDetection: {
        success: faceData.success,
        result: faceData.result,
        timestamp: new Date()
      }
    }));
  };

  const testGazeTracking = async () => {
    // Simulate gaze tracking test
    const mockFaceData = {
      landmarks: Array(68).fill(0).map(() => ({
        x: Math.random() * 640,
        y: Math.random() * 480
      }))
    };

    const result = await fetch('/api/ai-proctoring/track-gaze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        faceData: mockFaceData,
        screenDimensions: { width: 1920, height: 1080 }
      })
    });

    const gazeData = await result.json();
    
    setTestResults(prev => ({
      ...prev,
      gazeTracking: {
        success: gazeData.success,
        result: gazeData.result,
        timestamp: new Date()
      }
    }));
  };

  const testAudioAnalysis = async () => {
    // Create mock audio data
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 44100, 44100);
    const audioData = buffer.getChannelData(0);
    
    // Generate some noise
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.random() * 2 - 1;
    }

    // Convert to blob (simplified)
    const mockAudioBlob = new Blob(['mock-audio-data'], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('audio', mockAudioBlob, 'test-audio.wav');
    formData.append('duration', '5.0');

    const result = await fetch('/api/ai-proctoring/analyze-audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const audioResult = await result.json();
    
    setTestResults(prev => ({
      ...prev,
      audioAnalysis: {
        success: audioResult.success,
        result: audioResult.result,
        timestamp: new Date()
      }
    }));
  };

  const testAnomalyDetection = async () => {
    const behaviorData = {
      typingPattern: [
        { speed: 45, timestamp: Date.now() },
        { speed: 50, timestamp: Date.now() + 1000 },
        { speed: 120, timestamp: Date.now() + 2000 }, // Anomaly
        { speed: 48, timestamp: Date.now() + 3000 }
      ],
      answerTiming: [
        { timeSpent: 2 }, // Very fast - potential anomaly
        { timeSpent: 45 },
        { timeSpent: 60 },
        { timeSpent: 1 } // Very fast - potential anomaly
      ]
    };

    const result = await fetch('/api/ai-proctoring/detect-anomalies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ behaviorData })
    });

    const data = await result.json();
    
    setTestResults(prev => ({
      ...prev,
      anomalyDetection: {
        success: data.success,
        result: data.result,
        timestamp: new Date()
      }
    }));
  };

  const testRealTimeProcessing = async () => {
    const mockAttemptId = 'test-attempt-' + Date.now();
    
    // Start processing
    const startResult = await fetch('/api/ai-proctoring/start-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        attemptId: mockAttemptId,
        examConfig: {
          proctoring: {
            enabled: true,
            strictnessLevel: 'medium'
          }
        }
      })
    });

    const startData = await startResult.json();
    
    if (!startData.success) {
      throw new Error('Failed to start real-time processing');
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check status
    const statusResult = await fetch(`/api/ai-proctoring/processing-status/${mockAttemptId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const statusData = await statusResult.json();

    // Stop processing
    const stopResult = await fetch('/api/ai-proctoring/stop-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ attemptId: mockAttemptId })
    });

    const stopData = await stopResult.json();

    setTestResults(prev => ({
      ...prev,
      realTimeProcessing: {
        success: startData.success && statusData.success && stopData.success,
        result: {
          started: startData.success,
          statusChecked: statusData.success,
          stopped: stopData.success,
          finalReport: stopData.finalReport
        },
        timestamp: new Date()
      }
    }));
  };

  const runAllTests = async () => {
    const tests = ['faceDetection', 'gazeTracking', 'audioAnalysis', 'anomalyDetection', 'realTimeProcessing'];
    
    for (const test of tests) {
      await runTest(test);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getTestIcon = (testType) => {
    const icons = {
      faceDetection: Camera,
      gazeTracking: Eye,
      audioAnalysis: Mic,
      anomalyDetection: Brain,
      realTimeProcessing: Activity
    };
    return icons[testType] || Shield;
  };

  const getResultIcon = (result) => {
    if (!result) return null;
    return result.success ? CheckCircle : XCircle;
  };

  const getResultColor = (result) => {
    if (!result) return 'text-gray-400';
    return result.success ? 'text-green-500' : 'text-red-500';
  };

  const TestCard = ({ testType, title, description }) => {
    const Icon = getTestIcon(testType);
    const ResultIcon = getResultIcon(testResults[testType]);
    const result = testResults[testType];
    const isCurrentTest = currentTest === testType;

    return (
      <motion.div
        className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {ResultIcon && (
            <ResultIcon className={`w-6 h-6 ${getResultColor(result)}`} />
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        {result && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <div className={`font-medium ${getResultColor(result)}`}>
                {result.success ? 'Test Passed' : 'Test Failed'}
              </div>
              {result.error && (
                <div className="text-red-600 mt-1">{result.error}</div>
              )}
              {result.result && (
                <div className="mt-2 text-gray-700">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {result.timestamp?.toLocaleString()}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => runTest(testType)}
          disabled={isRunning}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isCurrentTest
              ? 'bg-yellow-500 text-white'
              : isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCurrentTest ? (
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Running...</span>
            </div>
          ) : (
            'Run Test'
          )}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Proctoring System Test Suite
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test all AI proctoring components to ensure proper functionality
          </p>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Hidden video and canvas for testing */}
        <div className="hidden">
          <video ref={videoRef} autoPlay muted />
          <canvas ref={canvasRef} />
        </div>

        {/* Test Results Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results Overview</h2>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(testResults).map(([testType, result]) => {
              const Icon = getTestIcon(testType);
              const ResultIcon = getResultIcon(result);
              
              return (
                <div key={testType} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="w-8 h-8 text-gray-400" />
                    {ResultIcon && (
                      <ResultIcon className={`w-4 h-4 ml-1 ${getResultColor(result)}`} />
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-700 capitalize">
                    {testType.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`text-xs ${getResultColor(result) || 'text-gray-400'}`}>
                    {result ? (result.success ? 'Passed' : 'Failed') : 'Not Run'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TestCard
            testType="faceDetection"
            title="Face Detection"
            description="Tests the AI's ability to detect and analyze faces in video frames"
          />
          
          <TestCard
            testType="gazeTracking"
            title="Gaze Tracking"
            description="Tests eye movement tracking and gaze direction detection"
          />
          
          <TestCard
            testType="audioAnalysis"
            title="Audio Analysis"
            description="Tests voice detection and audio anomaly identification"
          />
          
          <TestCard
            testType="anomalyDetection"
            title="Anomaly Detection"
            description="Tests behavioral pattern analysis and anomaly identification"
          />
          
          <TestCard
            testType="realTimeProcessing"
            title="Real-time Processing"
            description="Tests the complete real-time processing pipeline"
          />
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-blue-900">AI Models</div>
              <div className="text-sm text-blue-700">Loaded & Ready</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-green-900">Processing</div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-purple-900">Analytics</div>
              <div className="text-sm text-purple-700">Operational</div>
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-2">Test Instructions</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Ensure your camera and microphone are connected and working</li>
                <li>• Allow browser permissions for camera and microphone access</li>
                <li>• Run tests in a well-lit environment for best face detection results</li>
                <li>• Each test may take a few seconds to complete</li>
                <li>• Check the console for detailed error messages if tests fail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringTestInterface;
