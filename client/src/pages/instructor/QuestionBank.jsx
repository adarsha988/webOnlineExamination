import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { questionBankAPI } from '../../api/questionBank';

const QuestionBank = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    type: 'mcq',
    subject: '',
    difficulty: 'medium',
    marks: 1,
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [editQuestion, setEditQuestion] = useState({
    questionText: '',
    type: 'mcq',
    subject: '',
    difficulty: 'medium',
    marks: 1,
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  // Fetch questions
  const fetchQuestions = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        scope: 'private',
        ...(searchTerm && { search: searchTerm })
      };
      const data = await questionBankAPI.getQuestions(params);

      setQuestions(data.questions || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle add question
  const handleAddQuestion = async () => {
    try {
      const questionData = {
        ...newQuestion,
        scope: 'private'
      };
      
      await questionBankAPI.createQuestion(questionData);
      
      toast({
        title: "Question Added",
        description: "Question created successfully."
      });

      setShowAddDialog(false);
      setNewQuestion({
        questionText: '',
        type: 'mcq',
        subject: '',
        difficulty: 'medium',
        marks: 1,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      });
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Add question error:', error);
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add question.",
        variant: "destructive"
      });
    }
  };

  // Handle view question
  const handleViewQuestion = (question) => {
    setSelectedQuestion(question);
    setShowViewDialog(true);
  };

  // Handle edit question
  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setEditQuestion({
      questionText: question.questionText,
      type: question.type,
      subject: question.subject,
      difficulty: question.difficulty,
      marks: question.marks,
      options: question.options || ['', '', '', ''],
      correctAnswer: question.type === 'mcq' ? 
        (question.options ? question.options.indexOf(question.correctAnswer) : 0) : 
        question.correctAnswer,
      explanation: question.explanation || ''
    });
    setShowEditDialog(true);
  };

  // Handle update question
  const handleUpdateQuestion = async () => {
    try {
      const questionData = {
        ...editQuestion,
        correctAnswer: editQuestion.type === 'mcq' ? 
          editQuestion.options[editQuestion.correctAnswer] : 
          editQuestion.correctAnswer
      };
      
      await questionBankAPI.updateQuestion(selectedQuestion._id, questionData);
      
      toast({
        title: "Question Updated",
        description: "Question updated successfully."
      });

      setShowEditDialog(false);
      setSelectedQuestion(null);
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Update question error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update question.",
        variant: "destructive"
      });
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionBankAPI.deleteQuestion(questionId);
      toast({
        title: "Question Deleted",
        description: "Question deleted successfully."
      });
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete question.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchTerm]);


  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600 mt-1">Manage your question collection</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Create a new question for your question bank. Fill in all the required details below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Question Text</label>
                  <textarea
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    placeholder="Enter your question..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input
                      value={newQuestion.subject}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Marks</label>
                    <Input
                      type="number"
                      value={newQuestion.marks}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={newQuestion.type}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="truefalse">True/False</option>
                      <option value="short">Short Answer</option>
                      <option value="long">Long Answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {newQuestion.type === 'mcq' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Options</label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQuestion.correctAnswer === index}
                          onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                          className="mt-3"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    className="w-full p-3 border rounded-md"
                    rows={2}
                    placeholder="Explain the correct answer..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddQuestion} disabled={!newQuestion.questionText || !newQuestion.subject}>
                    Add Question
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Question Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Question</DialogTitle>
            <DialogDescription>
              Question details and information.
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question Text</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {selectedQuestion.questionText}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {selectedQuestion.subject}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {selectedQuestion.type}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {selectedQuestion.difficulty}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Marks</label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {selectedQuestion.marks}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Created</label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {new Date(selectedQuestion.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {selectedQuestion.type === 'mcq' && selectedQuestion.options && (
                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((option, index) => (
                      <div key={index} className={`p-2 rounded-md flex items-center gap-2 ${
                        option === selectedQuestion.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}>
                        <span className="font-medium">{index + 1}.</span>
                        <span>{option}</span>
                        {option === selectedQuestion.correctAnswer && (
                          <Badge className="ml-auto bg-green-100 text-green-800">Correct</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuestion.explanation && (
                <div>
                  <label className="block text-sm font-medium mb-2">Explanation</label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedQuestion.explanation}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium mb-2">Question Text</label>
              <textarea
                value={editQuestion.questionText}
                onChange={(e) => setEditQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                className="w-full p-3 border rounded-md"
                rows={3}
                placeholder="Enter your question..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={editQuestion.subject}
                  onChange={(e) => setEditQuestion(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Marks</label>
                <Input
                  type="number"
                  value={editQuestion.marks}
                  onChange={(e) => setEditQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={editQuestion.type}
                  onChange={(e) => setEditQuestion(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="truefalse">True/False</option>
                  <option value="short">Short Answer</option>
                  <option value="long">Long Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={editQuestion.difficulty}
                  onChange={(e) => setEditQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {editQuestion.type === 'mcq' && (
              <div>
                <label className="block text-sm font-medium mb-2">Options</label>
                {editQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditQuestion(prev => ({ ...prev, options: newOptions }));
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="editCorrectAnswer"
                      checked={editQuestion.correctAnswer === index}
                      onChange={() => setEditQuestion(prev => ({ ...prev, correctAnswer: index }))}
                      className="mt-3"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
              <textarea
                value={editQuestion.explanation}
                onChange={(e) => setEditQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                className="w-full p-3 border rounded-md"
                rows={2}
                placeholder="Explain the correct answer..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateQuestion} disabled={!editQuestion.questionText || !editQuestion.subject}>
                Update Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{question.subject}</Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="secondary">{question.type}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {question.questionText}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Marks: {question.marks}</span>
                        <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex gap-1">
                            {question.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewQuestion(question)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(question)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteQuestion(question._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show message if no questions */}
      {!loading && questions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No Questions Found</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first question using the "Add Question" button above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => fetchQuestions(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchQuestions(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
