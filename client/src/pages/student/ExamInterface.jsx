import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'wouter';
import { AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Timer from '../../components/Timer';
import QuestionNavigator from '../../components/QuestionNavigator';
import QuestionRenderer from '../../components/QuestionRenderer';
import { fetchExamById, fetchExamQuestions } from '../../store/examSlice';
import { startAttempt, submitAttempt, clearCurrentAttempt } from '../../store/attemptSlice';

const ExamInterface = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { id: examId } = useParams();
  const { toast } = useToast();
  
  const { currentExam, questions, isLoading: examLoading } = useSelector((state) => state.exam);
  const { currentAttempt, isSubmitted, isLoading: attemptLoading } = useSelector((state) => state.attempt);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    if (examId) {
      dispatch(fetchExamById(examId));
      dispatch(fetchExamQuestions(examId));
      dispatch(startAttempt(examId));
    }

    return () => {
      dispatch(clearCurrentAttempt());
    };
  }, [examId, dispatch]);

  useEffect(() => {
    if (isSubmitted) {
      toast({
        title: 'Exam Submitted',
        description: 'Your exam has been submitted successfully.',
      });
      setLocation('/student/results');
    }
  }, [isSubmitted, setLocation, toast]);

  const handleQuestionSelect = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - show submit confirmation
      setShowSubmitConfirm(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (currentAttempt) {
      dispatch(submitAttempt(currentAttempt.id));
    }
  };

  const handleTimeUp = () => {
    toast({
      title: 'Time Up!',
      description: 'Your exam has been automatically submitted.',
      variant: 'destructive',
    });
  };

  const handleSaveAndExit = () => {
    setLocation('/student/dashboard');
  };

  if (examLoading || attemptLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentExam || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Exam Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The exam you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => setLocation('/student/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Exam Header with Timer */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{currentExam.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              {currentAttempt && (
                <Timer
                  duration={currentExam.duration}
                  onTimeUp={handleTimeUp}
                />
              )}
              <Button
                variant="outline"
                onClick={handleSaveAndExit}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                data-testid="button-save-exit"
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <QuestionNavigator
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionSelect={handleQuestionSelect}
            />
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <QuestionRenderer
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />

            {/* Submit Exam Confirmation */}
            {showSubmitConfirm && (
              <div className="mt-6">
                <Alert className="border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Submit?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Make sure you've reviewed all your answers. Once submitted, you cannot make changes.
                        </p>
                        <div className="flex space-x-3">
                          <Button
                            onClick={handleSubmit}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={attemptLoading}
                            data-testid="button-submit-exam"
                          >
                            {attemptLoading ? 'Submitting...' : 'Submit Exam'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowSubmitConfirm(false)}
                            data-testid="button-cancel-submit"
                          >
                            Review Answers
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
