import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock } from 'lucide-react';
import { updateTimeRemaining, submitAttempt } from '../store/attemptSlice';

const Timer = ({ duration, onTimeUp }) => {
  const dispatch = useDispatch();
  const { timeRemaining, currentAttempt } = useSelector((state) => state.attempt);

  useEffect(() => {
    if (!timeRemaining) return;

    const timer = setInterval(() => {
      const newTime = timeRemaining - 1;
      
      if (newTime <= 0) {
        // Time is up - auto submit
        if (currentAttempt) {
          dispatch(submitAttempt(currentAttempt.id));
        }
        if (onTimeUp) onTimeUp();
        return;
      }
      
      dispatch(updateTimeRemaining(newTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, currentAttempt, dispatch, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-destructive'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-accent'; // Last 10 minutes
    return 'text-destructive';
  };

  if (!timeRemaining) return null;

  return (
    <div className={`flex items-center space-x-2 bg-destructive/10 px-4 py-2 rounded-lg timer-pulse ${getTimerColor()}`}>
      <Clock className="h-5 w-5" />
      <span className="font-mono text-lg font-semibold" data-testid="timer-display">
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

export default Timer;
