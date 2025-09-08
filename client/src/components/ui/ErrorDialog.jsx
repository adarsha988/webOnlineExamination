import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock, Shield, Clock, Server, Wifi } from 'lucide-react';

const ErrorDialog = ({ error, isOpen, onClose, onRetry }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (error?.code === 'RATE_LIMITED' && isOpen) {
      setCountdown(60); // 60 second countdown for rate limiting
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [error?.code, isOpen]);

  if (!error || !isOpen) return null;

  const getErrorIcon = (code) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return <Lock className="h-12 w-12 text-red-500" />;
      case 'FORBIDDEN':
        return <Shield className="h-12 w-12 text-orange-500" />;
      case 'RATE_LIMITED':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'SERVER_ERROR':
        return <Server className="h-12 w-12 text-purple-500" />;
      case 'NETWORK_ERROR':
        return <Wifi className="h-12 w-12 text-blue-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorTitle = (code) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Authentication Failed';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'RATE_LIMITED':
        return 'Too Many Attempts';
      case 'SERVER_ERROR':
        return 'Server Error';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      default:
        return 'Login Error';
    }
  };

  const getErrorActions = (code) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onRetry}>
              Try Again
            </Button>
          </>
        );
      case 'FORBIDDEN':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Contact Support
            </Button>
            <Button onClick={onClose}>
              OK
            </Button>
          </>
        );
      case 'RATE_LIMITED':
        return (
          <Button 
            onClick={onClose} 
            disabled={countdown > 0}
          >
            {countdown > 0 ? `Wait ${countdown}s` : 'OK'}
          </Button>
        );
      case 'SERVER_ERROR':
      case 'NETWORK_ERROR':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onRetry}>
              Retry
            </Button>
          </>
        );
      default:
        return (
          <Button onClick={onClose}>
            OK
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {getErrorIcon(error.code)}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {getErrorTitle(error.code)}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {error.message}
          </DialogDescription>
          
          {error.code === 'UNAUTHORIZED' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">Common Solutions:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Double-check your email and password</li>
                <li>• Ensure Caps Lock is not enabled</li>
                <li>• Try using a demo account if available</li>
              </ul>
            </div>
          )}
          
          {error.code === 'RATE_LIMITED' && countdown > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Please wait <strong>{countdown} seconds</strong> before attempting to login again.
              </p>
            </div>
          )}
          
          {error.code === 'NETWORK_ERROR' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Troubleshooting:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Disable VPN if enabled</li>
              </ul>
            </div>
          )}
        </DialogHeader>
        
        <DialogFooter className="flex justify-center space-x-2">
          {getErrorActions(error.code)}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDialog;
