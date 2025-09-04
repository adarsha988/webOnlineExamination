import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { updateAnswer, saveAnswer, markQuestionForReview, unmarkQuestionForReview } from '../store/attemptSlice';

const QuestionRenderer = ({ question, questionIndex, totalQuestions, onNext, onPrevious }) => {
  const dispatch = useDispatch();
  const { answers, markedQuestions = [], currentAttempt } = useSelector((state) => state.attempt);
  const [localAnswer, setLocalAnswer] = useState(answers[question.id] || '');

  useEffect(() => {
    setLocalAnswer(answers[question.id] || '');
  }, [question.id, answers]);

  const handleAnswerChange = (value) => {
    setLocalAnswer(value);
    dispatch(updateAnswer({ questionId: question.id, answer: value }));
    
    // Auto-save after a brief delay
    setTimeout(() => {
      if (currentAttempt) {
        dispatch(saveAnswer({
          attemptId: currentAttempt.id,
          questionId: question.id,
          answer: value
        }));
      }
    }, 1000);
  };

  const handleMarkForReview = () => {
    if (markedQuestions.includes(question.id)) {
      dispatch(unmarkQuestionForReview({ questionId: question.id }));
    } else {
      dispatch(markQuestionForReview({ questionId: question.id }));
    }
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup value={localAnswer} onValueChange={handleAnswerChange}>
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'true_false':
        return (
          <RadioGroup value={localAnswer} onValueChange={handleAnswerChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="text-sm">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="text-sm">False</Label>
            </div>
          </RadioGroup>
        );
      
      case 'short_answer':
        return (
          <Textarea
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-[150px]"
            data-testid="textarea-answer"
          />
        );
      
      default:
        return (
          <Textarea
            value={localAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-[150px]"
            data-testid="textarea-answer"
          />
        );
    }
  };

  const isMarked = markedQuestions.includes(question.id);
  const isLastQuestion = questionIndex === totalQuestions - 1;

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Question {questionIndex + 1}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Points: <span className="font-medium text-foreground">{question.points || 1}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkForReview}
              className={isMarked ? 'text-accent' : 'text-muted-foreground'}
              data-testid="button-bookmark"
            >
              {isMarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground mb-4">{question.text}</p>
          {question.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <label className="block text-sm font-medium text-foreground">Your Answer:</label>
        {renderQuestionInput()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={questionIndex === 0}
          data-testid="button-previous"
        >
          ← Previous
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleMarkForReview}
            data-testid="button-mark-review"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            {isMarked ? 'Unmark' : 'Mark for Review'}
          </Button>
          
          <Button
            onClick={onNext}
            data-testid={isLastQuestion ? "button-finish" : "button-next"}
          >
            {isLastQuestion ? 'Finish Exam' : 'Save & Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionRenderer;
