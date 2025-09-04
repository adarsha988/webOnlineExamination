import { useSelector, useDispatch } from 'react-redux';
import { markQuestionForReview, unmarkQuestionForReview } from '../store/attemptSlice';

const QuestionNavigator = ({ questions, currentQuestionIndex, onQuestionSelect }) => {
  const dispatch = useDispatch();
  const { answers, markedQuestions = [] } = useSelector((state) => state.attempt);

  const getQuestionStatus = (questionId, index) => {
    if (index === currentQuestionIndex) return 'current';
    if (markedQuestions.includes(questionId)) return 'marked';
    if (answers[questionId] !== undefined && answers[questionId] !== '') return 'answered';
    return 'unanswered';
  };

  const getButtonClass = (status) => {
    const baseClass = 'w-8 h-8 text-xs font-medium rounded border-2 transition-colors';
    
    switch (status) {
      case 'current':
        return `${baseClass} question-current`;
      case 'answered':
        return `${baseClass} question-answered`;
      case 'marked':
        return `${baseClass} question-marked`;
      default:
        return `${baseClass} question-unanswered`;
    }
  };

  const toggleMarkForReview = (questionId) => {
    if (markedQuestions.includes(questionId)) {
      dispatch(unmarkQuestionForReview({ questionId }));
    } else {
      dispatch(markQuestionForReview({ questionId }));
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm sticky top-24">
      <h3 className="text-sm font-semibold text-foreground mb-4">Question Navigator</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {questions.map((question, index) => {
          const status = getQuestionStatus(question.id, index);
          return (
            <button
              key={question.id}
              className={getButtonClass(status)}
              onClick={() => onQuestionSelect(index)}
              data-testid={`question-nav-${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded border-2 border-primary bg-primary"></div>
          <span className="text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded border-2 border-secondary bg-secondary"></div>
          <span className="text-muted-foreground">Answered</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded border-2 border-accent bg-accent"></div>
          <span className="text-muted-foreground">Marked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded border-2 border-border bg-card"></div>
          <span className="text-muted-foreground">Not Answered</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => toggleMarkForReview(questions[currentQuestionIndex]?.id)}
          className="w-full text-xs bg-accent/10 text-accent hover:bg-accent/20 py-2 px-3 rounded transition-colors"
          data-testid="button-mark-review"
        >
          {markedQuestions.includes(questions[currentQuestionIndex]?.id) 
            ? 'Unmark for Review' 
            : 'Mark for Review'
          }
        </button>
      </div>
    </div>
  );
};

export default QuestionNavigator;
