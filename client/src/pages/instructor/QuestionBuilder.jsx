import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'wouter';
import { Plus, Trash2, Save, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import InstructorLayout from '../../layouts/InstructorLayout';
import { fetchExamById, fetchExamQuestions, addQuestion, updateExam } from '../../store/examSlice';

const QuestionBuilder = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { id: examId } = useParams();
  const { toast } = useToast();
  
  const { currentExam, questions, isLoading } = useSelector((state) => state.exam);
  
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple_choice',
    text: '',
    description: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    sampleAnswers: [''],
    points: 1,
    order: 1,
  });

  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    if (examId) {
      dispatch(fetchExamById(examId));
      dispatch(fetchExamQuestions(examId));
    }
  }, [examId, dispatch]);

  useEffect(() => {
    if (questions.length > 0) {
      setCurrentQuestion(prev => ({
        ...prev,
        order: questions.length + 1
      }));
    }
  }, [questions.length]);

  const handleInputChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleSampleAnswerChange = (index, value) => {
    const newSampleAnswers = [...currentQuestion.sampleAnswers];
    newSampleAnswers[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      sampleAnswers: newSampleAnswers
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      setCurrentQuestion(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const addSampleAnswer = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      sampleAnswers: [...prev.sampleAnswers, '']
    }));
  };

  const removeSampleAnswer = (index) => {
    if (currentQuestion.sampleAnswers.length > 1) {
      const newSampleAnswers = currentQuestion.sampleAnswers.filter((_, i) => i !== index);
      setCurrentQuestion(prev => ({
        ...prev,
        sampleAnswers: newSampleAnswers
      }));
    }
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion.text.trim()) {
      toast({
        title: 'Missing Question Text',
        description: 'Please enter the question text.',
        variant: 'destructive',
      });
      return;
    }

    if (currentQuestion.type === 'multiple_choice' && 
        (!currentQuestion.correctAnswer || currentQuestion.options.some(opt => !opt.trim()))) {
      toast({
        title: 'Incomplete Multiple Choice',
        description: 'Please fill in all options and select the correct answer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dispatch(addQuestion({
        examId,
        questionData: currentQuestion
      })).unwrap();

      toast({
        title: 'Question Added',
        description: 'Question has been added successfully.',
      });

      // Reset form
      setCurrentQuestion({
        type: 'multiple_choice',
        text: '',
        description: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        sampleAnswers: [''],
        points: 1,
        order: questions.length + 2,
      });
      setEditingIndex(-1);
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error || 'Failed to save question.',
        variant: 'destructive',
      });
    }
  };

  const handlePublishExam = async () => {
    if (questions.length === 0) {
      toast({
        title: 'No Questions',
        description: 'Please add at least one question before publishing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dispatch(updateExam({
        examId,
        examData: { status: 'active' }
      })).unwrap();

      toast({
        title: 'Exam Published',
        description: 'Your exam is now active and ready for students.',
      });

      setLocation('/instructor/dashboard');
    } catch (error) {
      toast({
        title: 'Publish Failed',
        description: error || 'Failed to publish exam.',
        variant: 'destructive',
      });
    }
  };

  const renderQuestionForm = () => (
    <div className="space-y-6">
      {/* Question Type */}
      <div>
        <Label className="text-sm font-medium text-foreground">Question Type</Label>
        <Select 
          value={currentQuestion.type} 
          onValueChange={(value) => handleInputChange('type', value)}
        >
          <SelectTrigger className="mt-1" data-testid="select-question-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <SelectItem value="true_false">True/False</SelectItem>
            <SelectItem value="short_answer">Short Answer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Question Text */}
      <div>
        <Label className="text-sm font-medium text-foreground">Question Text *</Label>
        <Textarea
          value={currentQuestion.text}
          onChange={(e) => handleInputChange('text', e.target.value)}
          placeholder="Enter your question here..."
          className="mt-1"
          rows={3}
          data-testid="textarea-question-text"
        />
      </div>

      {/* Description */}
      <div>
        <Label className="text-sm font-medium text-foreground">Additional Instructions</Label>
        <Textarea
          value={currentQuestion.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Optional additional instructions or context..."
          className="mt-1"
          rows={2}
          data-testid="textarea-description"
        />
      </div>

      {/* Points */}
      <div>
        <Label className="text-sm font-medium text-foreground">Points</Label>
        <Input
          type="number"
          min="1"
          max="20"
          value={currentQuestion.points}
          onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 1)}
          className="mt-1 w-32"
          data-testid="input-points"
        />
      </div>

      {/* Type-specific fields */}
      {currentQuestion.type === 'multiple_choice' && (
        <div>
          <Label className="text-sm font-medium text-foreground">Answer Options</Label>
          <div className="mt-1 space-y-2">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                  data-testid={`input-option-${index}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange('correctAnswer', option)}
                  className={currentQuestion.correctAnswer === option ? 'bg-secondary text-secondary-foreground' : ''}
                  data-testid={`button-correct-${index}`}
                >
                  Correct
                </Button>
                {currentQuestion.options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              data-testid="button-add-option"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      {currentQuestion.type === 'true_false' && (
        <div>
          <Label className="text-sm font-medium text-foreground">Correct Answer</Label>
          <Select 
            value={currentQuestion.correctAnswer} 
            onValueChange={(value) => handleInputChange('correctAnswer', value)}
          >
            <SelectTrigger className="mt-1 w-48" data-testid="select-correct-answer">
              <SelectValue placeholder="Select correct answer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {currentQuestion.type === 'short_answer' && (
        <div>
          <Label className="text-sm font-medium text-foreground">Sample Answers (for AI grading)</Label>
          <div className="mt-1 space-y-2">
            {currentQuestion.sampleAnswers.map((answer, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={answer}
                  onChange={(e) => handleSampleAnswerChange(index, e.target.value)}
                  placeholder={`Sample answer ${index + 1}`}
                  className="flex-1"
                  data-testid={`input-sample-${index}`}
                />
                {currentQuestion.sampleAnswers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSampleAnswer(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSampleAnswer}
              data-testid="button-add-sample"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sample Answer
            </Button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4 border-t border-border">
        <Button onClick={handleSaveQuestion} disabled={isLoading} data-testid="button-save-question">
          <Save className="h-4 w-4 mr-2" />
          {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
        </Button>
      </div>
    </div>
  );

  if (isLoading || !currentExam) {
    return (
      <InstructorLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/instructor/dashboard')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{currentExam.title}</h1>
              <p className="text-muted-foreground">Add and manage questions for this exam</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handlePublishExam} data-testid="button-publish">
              Publish Exam
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
              </CardHeader>
              <CardContent>
                {renderQuestionForm()}
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Questions ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                        data-testid={`question-item-${index}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              Q{index + 1}: {question.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {question.text}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">
                            {question.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No questions added yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start by adding your first question.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exam Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Exam Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Questions:</span>
                  <span className="text-sm font-medium text-foreground">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Points:</span>
                  <span className="text-sm font-medium text-foreground">
                    {questions.reduce((sum, q) => sum + q.points, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm font-medium text-foreground">{currentExam.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`text-sm font-medium ${
                    currentExam.status === 'active' ? 'text-secondary' : 'text-accent'
                  }`}>
                    {currentExam.status === 'active' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default QuestionBuilder;
