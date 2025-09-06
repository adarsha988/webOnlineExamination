import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  FileText,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ExamCreation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    totalMarks: 0,
    scheduleDate: '',
    status: 'draft'
  });
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    type: ''
  });

  const steps = [
    { id: 1, title: 'Exam Details', icon: FileText },
    { id: 2, title: 'Add Questions', icon: Plus },
    { id: 3, title: 'Review & Publish', icon: Check }
  ];

  // Fetch question banks and questions
  useEffect(() => {
    fetchQuestionBanks();
  }, []);

  useEffect(() => {
    if (currentStep === 2) {
      fetchQuestions();
    }
  }, [currentStep, selectedBank, searchTerm, filters]);

  const fetchQuestionBanks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch private questions count
      const privateResponse = await fetch('/api/questions?scope=private&limit=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const privateData = await privateResponse.json();
      
      // Fetch shared banks
      const sharedResponse = await fetch('/api/shared-banks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sharedData = await sharedResponse.json();

      const banks = [
        {
          _id: 'private',
          name: 'My Questions',
          type: 'private',
          questionCount: privateData.pagination?.totalItems || 0,
          description: 'Your private question collection'
        },
        ...sharedData.sharedBanks.map(bank => ({
          ...bank,
          type: 'shared',
          questionCount: bank.stats.totalQuestions
        }))
      ];

      setQuestionBanks(banks);
      if (banks.length > 0) {
        setSelectedBank(banks[0]);
      }
    } catch (error) {
      console.error('Error fetching question banks:', error);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedBank) return;

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        scope: selectedBank.type === 'private' ? 'private' : 'shared',
        ...(selectedBank.type === 'shared' && { sharedBankId: selectedBank._id }),
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        limit: '50'
      });

      const response = await fetch(`/api/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleExamDataChange = (field, value) => {
    setExamData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = (question) => {
    if (!selectedQuestions.find(q => q._id === question._id)) {
      const questionWithMarks = { ...question, examMarks: question.marks || 1 };
      setSelectedQuestions(prev => [...prev, questionWithMarks]);
      updateTotalMarks([...selectedQuestions, questionWithMarks]);
    }
  };

  const removeQuestion = (questionId) => {
    const updated = selectedQuestions.filter(q => q._id !== questionId);
    setSelectedQuestions(updated);
    updateTotalMarks(updated);
  };

  const updateQuestionMarks = (questionId, marks) => {
    const updated = selectedQuestions.map(q => 
      q._id === questionId ? { ...q, examMarks: parseInt(marks) || 0 } : q
    );
    setSelectedQuestions(updated);
    updateTotalMarks(updated);
  };

  const updateTotalMarks = (questions) => {
    const total = questions.reduce((sum, q) => sum + (q.examMarks || 0), 0);
    setExamData(prev => ({ ...prev, totalMarks: total }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(selectedQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedQuestions(items);
  };

  const createExam = async () => {
    try {
      const token = localStorage.getItem('token');
      const examPayload = {
        ...examData,
        questionIds: selectedQuestions.map(q => q._id),
        questionMarks: selectedQuestions.reduce((acc, q) => {
          acc[q._id] = q.examMarks;
          return acc;
        }, {})
      };

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(examPayload)
      });

      if (response.ok) {
        const exam = await response.json();
        console.log('Exam created successfully:', exam);
        // Navigate to exams list or show success message
      } else {
        console.error('Failed to create exam');
      }
    } catch (error) {
      console.error('Error creating exam:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Title *</label>
                  <Input
                    placeholder="Enter exam title"
                    value={examData.title}
                    onChange={(e) => handleExamDataChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={examData.subject}
                    onChange={(e) => handleExamDataChange('subject', e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter exam description"
                  value={examData.description}
                  onChange={(e) => handleExamDataChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes) *</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={examData.duration}
                    onChange={(e) => handleExamDataChange('duration', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule Date</label>
                  <Input
                    type="datetime-local"
                    value={examData.scheduleDate}
                    onChange={(e) => handleExamDataChange('scheduleDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Question Bank Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Question Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {questionBanks.map(bank => (
                    <Card 
                      key={bank._id}
                      className={`cursor-pointer transition-all ${
                        selectedBank?._id === bank._id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedBank(bank)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{bank.name}</h3>
                          <Badge variant={bank.type === 'private' ? 'default' : 'secondary'}>
                            {bank.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{bank.description}</p>
                        <div className="text-sm">
                          <span className="font-medium">{bank.questionCount}</span> questions
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Questions</CardTitle>
                  <div className="flex gap-2">
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
                  <div className="flex gap-2">
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="mcq">MCQ</option>
                      <option value="truefalse">True/False</option>
                      <option value="short">Short Answer</option>
                      <option value="long">Long Answer</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto space-y-3">
                  {availableQuestions.map(question => (
                    <div 
                      key={question._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{question.subject}</Badge>
                            <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{question.type}</Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {question.questionText}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Marks: {question.marks}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addQuestion(question)}
                          disabled={selectedQuestions.some(q => q._id === question._id)}
                          className="ml-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Selected Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Selected Questions ({selectedQuestions.length})</CardTitle>
                  <p className="text-sm text-gray-600">
                    Total Marks: {examData.totalMarks}
                  </p>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="selected-questions">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {selectedQuestions.map((question, index) => (
                            <Draggable key={question._id} draggableId={question._id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="p-3 border rounded-lg bg-white"
                                >
                                  <div className="flex items-start gap-3">
                                    <div {...provided.dragHandleProps} className="mt-1">
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">{question.subject}</Badge>
                                        <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                                          {question.difficulty}
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                        {question.questionText}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <label className="text-xs">Marks:</label>
                                        <Input
                                          type="number"
                                          value={question.examMarks}
                                          onChange={(e) => updateQuestionMarks(question._id, e.target.value)}
                                          className="w-16 h-6 text-xs"
                                          min="0"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeQuestion(question._id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Exam Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {examData.title}</div>
                      <div><strong>Subject:</strong> {examData.subject}</div>
                      <div><strong>Duration:</strong> {examData.duration} minutes</div>
                      <div><strong>Total Questions:</strong> {selectedQuestions.length}</div>
                      <div><strong>Total Marks:</strong> {examData.totalMarks}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Question Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(
                        selectedQuestions.reduce((acc, q) => {
                          acc[q.type] = (acc[q.type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type}>
                          <strong>{type.toUpperCase()}:</strong> {count} questions
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Questions Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedQuestions.map((question, index) => (
                  <div key={question._id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="secondary">{question.type}</Badge>
                      </div>
                      <Badge variant="outline">{question.examMarks} marks</Badge>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{question.questionText}</p>
                    {question.options && (
                      <div className="ml-4 space-y-1">
                        {question.options.map((option, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {String.fromCharCode(65 + idx)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
          <p className="text-gray-600 mt-1">Build your exam step by step</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderStepContent()}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
              disabled={
                (currentStep === 1 && (!examData.title || !examData.subject)) ||
                (currentStep === 2 && selectedQuestions.length === 0)
              }
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setExamData(prev => ({ ...prev, status: 'draft' }))}>
                Save as Draft
              </Button>
              <Button onClick={createExam} className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Create Exam
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCreation;
