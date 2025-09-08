import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export const useAIProctoring = (attemptId, onViolation) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState([]);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const gazeTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  const [gazeAwayStartTime, setGazeAwayStartTime] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lastViolationTime, setLastViolationTime] = useState(0);

  // Initialize face-api.js models
  const initializeFaceAPI = useCallback(async () => {
    try {
      const MODEL_URL = '/models'; // Place face-api.js models in public/models
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Failed to initialize face-api.js:', error);
      return false;
    }
  }, []);

  // Initialize camera and audio
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Initialize audio context for voice detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize media:', error);
      logViolation('system_error', 'high', 'Failed to access camera/microphone');
      return false;
    }
  }, []);

  // Log violation to backend
  const logViolation = useCallback(async (eventType, severity = 'medium', description = '', metadata = {}) => {
    try {
      const now = Date.now();
      if (now - lastViolationTime < 1000) return; // Throttle violations
      
      setLastViolationTime(now);
      
      const response = await fetch('/api/proctoring/log-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attemptId,
          eventType,
          severity,
          description,
          metadata,
          timestamp: new Date().toISOString(),
          timeIntoExam: Math.floor((Date.now() - sessionStorage.getItem('examStartTime')) / 1000)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const violation = { eventType, severity, description, timestamp: new Date() };
        setViolations(prev => [...prev, violation]);
        
        if (onViolation) {
          onViolation(violation, result);
        }
        
        // Auto-submit if too many violations
        if (result.terminated) {
          window.dispatchEvent(new CustomEvent('forceSubmitExam'));
        }
      }
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  }, [attemptId, onViolation, lastViolationTime]);

  // Face detection and recognition
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !isInitialized) return;
    
    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();
      
      if (detections.length === 0) {
        logViolation('no_face', 'high', 'No face detected in camera');
        return;
      }
      
      if (detections.length > 1) {
        logViolation('multiple_faces', 'critical', 'Multiple faces detected');
        return;
      }
      
      const detection = detections[0];
      
      // Face recognition - compare with registered face
      if (faceDescriptor) {
        const distance = faceapi.euclideanDistance(detection.descriptor, faceDescriptor);
        if (distance > 0.6) { // Threshold for face mismatch
          logViolation('face_mismatch', 'critical', 'Face does not match registered student');
          return;
        }
      } else {
        // Store first face as reference
        setFaceDescriptor(detection.descriptor);
      }
      
      // Gaze tracking based on face landmarks
      const landmarks = detection.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      
      // Simple gaze estimation
      const eyeCenter = {
        x: (leftEye[0].x + rightEye[3].x) / 2,
        y: (leftEye[0].y + rightEye[3].y) / 2
      };
      
      const noseCenter = {
        x: nose[3].x,
        y: nose[3].y
      };
      
      // Check if looking away (simplified)
      const gazeOffset = Math.abs(eyeCenter.x - noseCenter.x);
      const isLookingAway = gazeOffset > 20; // Adjust threshold as needed
      
      if (isLookingAway) {
        if (!gazeAwayStartTime) {
          setGazeAwayStartTime(Date.now());
        } else if (Date.now() - gazeAwayStartTime > 3000) { // 3 seconds
          logViolation('look_away_extended', 'high', 'Looking away for more than 3 seconds');
          setGazeAwayStartTime(null);
        }
      } else {
        setGazeAwayStartTime(null);
      }
      
      // Check expressions for suspicious behavior
      const expressions = detection.expressions;
      if (expressions.surprised > 0.8) {
        logViolation('suspicious_expression', 'medium', 'Suspicious facial expression detected');
      }
      
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [isInitialized, faceDescriptor, gazeAwayStartTime, logViolation]);

  // Audio monitoring for multiple voices
  const monitorAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Simple voice activity detection
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    
    if (average > 50) { // Adjust threshold
      // Analyze frequency patterns for multiple voices (simplified)
      const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b) / 10;
      const midFreq = dataArray.slice(10, 50).reduce((a, b) => a + b) / 40;
      const highFreq = dataArray.slice(50, 100).reduce((a, b) => a + b) / 50;
      
      // Multiple voice detection heuristic
      if (lowFreq > 30 && midFreq > 40 && highFreq > 20) {
        logViolation('multiple_voices', 'high', 'Multiple voices detected in audio');
      }
    }
  }, [logViolation]);

  // Tab switch and window blur detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'high', 'Student switched tabs or minimized window');
        setTabSwitchCount(prev => prev + 1);
      }
    };
    
    const handleWindowBlur = () => {
      logViolation('window_blur', 'medium', 'Window lost focus');
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation('fullscreen_exit', 'high', 'Exited fullscreen mode');
      }
    };
    
    // Disable copy-paste and right-click
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        logViolation('copy_paste', 'medium', 'Attempted copy/paste operation');
      }
      
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        logViolation('dev_tools_open', 'critical', 'Attempted to open developer tools');
      }
    };
    
    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('right_click', 'low', 'Right-click attempted');
    };
    
    if (isMonitoring) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isMonitoring, logViolation]);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (!isInitialized) {
      const initialized = await initializeFaceAPI();
      if (!initialized) return false;
    }
    
    const mediaInitialized = await initializeMedia();
    if (!mediaInitialized) return false;
    
    setIsMonitoring(true);
    
    // Start face detection interval
    intervalRef.current = setInterval(() => {
      detectFace();
      monitorAudio();
    }, 2000); // Check every 2 seconds
    
    // Request fullscreen
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn('Could not enter fullscreen:', error);
    }
    
    logViolation('session_start', 'info', 'Proctoring session started');
    return true;
  }, [isInitialized, initializeFaceAPI, initializeMedia, detectFace, monitorAudio, logViolation]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (gazeTimerRef.current) {
      clearTimeout(gazeTimerRef.current);
      gazeTimerRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    logViolation('session_end', 'info', 'Proctoring session ended');
  }, [logViolation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    isInitialized,
    isMonitoring,
    violations,
    tabSwitchCount,
    videoRef,
    canvasRef,
    startMonitoring,
    stopMonitoring,
    logViolation
  };
};
