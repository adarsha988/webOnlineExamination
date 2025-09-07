import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, CameraOff, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProctoringSetup = ({ onSetupComplete, examId, examTitle }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: null,
    microphone: null
  });
  const [mediaStream, setMediaStream] = useState(null);
  const [faceVerification, setFaceVerification] = useState({
    status: 'pending', // pending, capturing, verifying, success, failed
    confidence: 0,
    attempts: 0
  });
  const [systemCheck, setSystemCheck] = useState({
    browser: null,
    connection: null,
    performance: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const steps = [
    {
      id: 'permissions',
      title: 'Camera & Microphone Access',
      description: 'Grant access to your camera and microphone for proctoring'
    },
    {
      id: 'system-check',
      title: 'System Requirements',
      description: 'Verify your system meets the requirements'
    },
    {
      id: 'face-verification',
      title: 'Identity Verification',
      description: 'Verify your identity using facial recognition'
    },
    {
      id: 'instructions',
      title: 'Exam Instructions',
      description: 'Review important exam guidelines and rules'
    }
  ];

  useEffect(() => {
    performSystemCheck();
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const performSystemCheck = () => {
    setSystemCheck({
      browser: checkBrowserCompatibility(),
      connection: checkNetworkConnection(),
      performance: checkSystemPerformance()
    });
  };

  const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    
    if (isChrome || isFirefox || isEdge) {
      return { status: 'pass', message: 'Browser is compatible' };
    }
    return { status: 'fail', message: 'Please use Chrome, Firefox, or Edge' };
  };

  const checkNetworkConnection = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const speed = connection.downlink;
      if (speed >= 1) {
        return { status: 'pass', message: `Good connection (${speed} Mbps)` };
      }
      return { status: 'warning', message: `Slow connection (${speed} Mbps)` };
    }
    return { status: 'pass', message: 'Connection check unavailable' };
  };

  const checkSystemPerformance = () => {
    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    
    if (memory >= 4 && cores >= 2) {
      return { status: 'pass', message: 'System performance is good' };
    }
    return { status: 'warning', message: 'System may be slow during exam' };
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setMediaStream(stream);
      setPermissions({
        camera: 'granted',
        microphone: 'granted'
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCurrentStep(1);
    } catch (err) {
      console.error('Permission error:', err);
      setError('Camera and microphone access is required for this exam');
      setPermissions({
        camera: 'denied',
        microphone: 'denied'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const captureAndVerifyFace = async () => {
    if (!mediaStream || !videoRef.current || !canvasRef.current) {
      setError('Camera not available');
      return;
    }

    setFaceVerification(prev => ({ ...prev, status: 'capturing' }));

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        setFaceVerification(prev => ({ ...prev, status: 'verifying' }));

        try {
          // Simulate face verification API call
          const formData = new FormData();
          formData.append('image', blob);
          formData.append('examId', examId);

          // In real implementation, call your face verification API
          const response = await fetch('/api/proctoring/verify-face', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          const result = await response.json();

          if (result.verified) {
            setFaceVerification({
              status: 'success',
              confidence: result.confidence,
              attempts: faceVerification.attempts + 1
            });
            setTimeout(() => setCurrentStep(3), 1500);
          } else {
            setFaceVerification(prev => ({
              status: 'failed',
              confidence: result.confidence,
              attempts: prev.attempts + 1
            }));
            
            if (faceVerification.attempts >= 2) {
              setError('Face verification failed. Please contact support.');
            }
          }
        } catch (err) {
          console.error('Face verification error:', err);
          setFaceVerification(prev => ({
            status: 'failed',
            confidence: 0,
            attempts: prev.attempts + 1
          }));
          setError('Face verification failed. Please try again.');
        }
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image. Please try again.');
      setFaceVerification(prev => ({ ...prev, status: 'pending' }));
    }
  };

  const handleStartExam = () => {
    const setupData = {
      permissions,
      systemCheck,
      faceVerification,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    onSetupComplete(setupData);
  };

  const renderPermissionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Camera & Microphone Access</h3>
        <p className="text-gray-600 mb-6">
          We need access to your camera and microphone to ensure exam integrity
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Camera className="w-5 h-5 text-gray-500" />
            <span>Camera Access</span>
          </div>
          <div className="flex items-center space-x-2">
            {permissions.camera === 'granted' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {permissions.camera === 'denied' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {permissions.camera === null && (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Mic className="w-5 h-5 text-gray-500" />
            <span>Microphone Access</span>
          </div>
          <div className="flex items-center space-x-2">
            {permissions.microphone === 'granted' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {permissions.microphone === 'denied' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {permissions.microphone === null && (
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={requestPermissions}
        disabled={isLoading || permissions.camera === 'granted'}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
        <span>
          {permissions.camera === 'granted' ? 'Permissions Granted' : 'Grant Permissions'}
        </span>
      </button>
    </div>
  );

  const renderSystemCheckStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">System Requirements Check</h3>
        <p className="text-gray-600 mb-6">
          Verifying your system meets the minimum requirements
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(systemCheck).map(([key, check]) => (
          <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="capitalize">{key.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              {check?.status === 'pass' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {check?.status === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              {check?.status === 'fail' && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">{check?.message}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setCurrentStep(2)}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
      >
        Continue to Face Verification
      </button>
    </div>
  );

  const renderFaceVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
        <p className="text-gray-600 mb-6">
          Please look directly at the camera for face verification
        </p>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {faceVerification.status === 'capturing' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Capturing image...</p>
            </div>
          </div>
        )}

        {faceVerification.status === 'verifying' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Verifying identity...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        {faceVerification.status === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700">
              Face verification successful! (Confidence: {(faceVerification.confidence * 100).toFixed(1)}%)
            </p>
          </div>
        )}

        {faceVerification.status === 'failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">
              Face verification failed. Please ensure good lighting and look directly at the camera.
            </p>
            <p className="text-sm text-red-600 mt-1">
              Attempts: {faceVerification.attempts}/3
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        {faceVerification.status !== 'success' && faceVerification.attempts < 3 && (
          <button
            onClick={captureAndVerifyFace}
            disabled={faceVerification.status === 'capturing' || faceVerification.status === 'verifying'}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {faceVerification.status === 'pending' ? 'Verify Identity' : 'Try Again'}
          </button>
        )}

        {faceVerification.status === 'success' && (
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700"
          >
            Continue to Instructions
          </button>
        )}
      </div>
    </div>
  );

  const renderInstructionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Exam Instructions</h3>
        <p className="text-gray-600 mb-6">
          Please read and acknowledge the following exam rules
        </p>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">During the Exam:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Keep your face visible to the camera at all times</li>
            <li>• Do not switch tabs or minimize the browser window</li>
            <li>• Do not use external devices or materials</li>
            <li>• Maintain a quiet environment</li>
            <li>• Do not communicate with others</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Technical Requirements:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Stable internet connection required</li>
            <li>• Keep your device plugged in if possible</li>
            <li>• Close unnecessary applications</li>
            <li>• Ensure good lighting for face detection</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Violations:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Multiple violations may result in exam termination</li>
            <li>• All activities are monitored and recorded</li>
            <li>• Suspicious behavior will be flagged for review</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <input type="checkbox" id="acknowledge" className="rounded" />
        <label htmlFor="acknowledge" className="text-sm text-gray-700">
          I have read and understand the exam rules and agree to comply with all requirements
        </label>
      </div>

      <button
        onClick={handleStartExam}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
      >
        Start Exam: {examTitle}
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderPermissionsStep();
      case 1: return renderSystemCheckStep();
      case 2: return renderFaceVerificationStep();
      case 3: return renderInstructionsStep();
      default: return renderPermissionsStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Current Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProctoringSetup;
