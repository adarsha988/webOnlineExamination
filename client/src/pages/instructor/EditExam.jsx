import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Trash2,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import InstructorLayout from '../../layouts/InstructorLayout';
import api from '../../api/axios';

const EditExam = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    scheduledDate: '',
    endDate: '',
    questions: [],
    settings: {
      allowRetake: false,
      showResults: true,
      randomizeQuestions: false
    }
  });

  useEffect(() => {
    if (id) {
      loadExam();
      loadAvailableQuestions();
    }
  }, [id]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/exams/${id}`);
      const examData = response.data;
      
      setExam(examData);
      setFormData({
        title: examData.title || '',
        description: examData.description || '',
        subject: examData.subject || '',
        duration: examData.duration || 60,
        totalMarks: examData.totalMarks || 100,
        passingMarks: examData.passingMarks || 40,
        scheduledDate: examData.scheduledDate ? new Date(examData.scheduledDate).toISOString().slice(0, 16) : '',
        endDate: examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : '',
        questions: examData.questions || [],
        settings: {
          allowRetake: examData.settings?.allowRetake || false,
          showResults: examData.settings?.showResults || true,
          randomizeQuestions: examData.settings?.randomizeQuestions || false
        }
      });
    } catch (error) {
      console.error('Error loading exam:', error);
      toast({
        title: "Error",
        description: "Failed to load exam details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableQuestions = async () => {
    try {
      const response = await api.get(`/api/questions?scope=private&instructorId=${user.id}`);
      setAvailableQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
    
    if (formData.totalMarks < 1) {
      newErrors.totalMarks = 'Total marks must be at least 1';
    }
    
    if (formData.passingMarks < 0 || formData.passingMarks > formData.totalMarks) {
      newErrors.passingMarks = 'Passing marks must be between 0 and total marks';
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }
    
    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    // Check for overlapping schedules
    const scheduledDate = new Date(formData.scheduledDate);
    const now = new Date();
    if (scheduledDate < now) {
      newErrors.scheduledDate = 'Scheduled date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleQuestionDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({
      ...prev,
      questions: items
    }));
  };

  const addQuestion = (question) => {
    if (formData.questions.find(q => q._id === question._id)) {
      toast({
        title: "Question already added",
        description: "This question is already in the exam",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...question, marks: 1 }]
    }));
    
    toast({
      title: "Question added",
      description: "Question has been added to the exam",
    });
  };

  const removeQuestion = (questionId) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q._id !== questionId)
    }));
  };

  const updateQuestionMarks = (questionId, marks) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q._id === questionId ? { ...q, marks: parseInt(marks) || 1 } : q
      )
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        questions: formData.questions.map(q => q._id),
        totalMarks: formData.questions.reduce((sum, q) => sum + (q.marks || 1), 0)
      };

      await api.put(`/api/exams/${id}`, updateData);
      
      toast({
        title: "Success",
        description: "Exam updated successfully",
      });
      
      setLocation('/instructor/exams');
    } catch (error) {
      console.error('Error saving exam:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update exam",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  if (!exam) {
    return (
      <InstructorLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam not found</h3>
          <p className="text-gray-600 mb-4">The exam you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => setLocation('/instructor/exams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
        </div>
      </InstructorLayout>
    );
  }

  const totalMarks = formData.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/instructor/exams')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Exam</h1>
              <p className="text-gray-600 mt-1">Modify exam details and questions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Validation Warnings */}
        {exam.status === 'published' && exam.attempts?.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This exam has been published and has student submissions. Some changes may not be allowed.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter exam title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter exam description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Enter subject"
                      className={errors.subject ? 'border-red-500' : ''}
                    />
                    {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="1"
                      className={errors.duration ? 'border-red-500' : ''}
                    />
                    {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passingMarks">Passing Marks *</Label>
                    <Input
                      id="passingMarks"
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) => handleInputChange('passingMarks', parseInt(e.target.value))}
                      min="0"
                      max={totalMarks}
                      className={errors.passingMarks ? 'border-red-500' : ''}
                    />
                    {errors.passingMarks && <p className="text-sm text-red-500 mt-1">{errors.passingMarks}</p>}
                  </div>

                  <div>
                    <Label>Total Marks</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      <span className="text-sm font-medium">{totalMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                      className={errors.scheduledDate ? 'border-red-500' : ''}
                    />
                    {errors.scheduledDate && <p className="text-sm text-red-500 mt-1">{errors.scheduledDate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Questions ({formData.questions.length})</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setShowQuestionBank(!showQuestionBank)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {errors.questions && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.questions}</AlertDescription>
                  </Alert>
                )}

                {formData.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No questions added yet</p>
                    <p className="text-sm">Click "Add Questions" to get started</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleQuestionDragEnd}>
                    <Droppable droppableId="questions">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {formData.questions.map((question, index) => (
                            <Draggable key={question._id} draggableId={question._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-4 border rounded-lg bg-white ${
                                    snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mt-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">
                                          {index + 1}. {question.question}
                                        </h4>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeQuestion(question._id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <Badge variant="outline">{question.type}</Badge>
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor={`marks-${question._id}`} className="text-sm">
                                            Marks:
                                          </Label>
                                          <Input
                                            id={`marks-${question._id}`}
                                            type="number"
                                            min="1"
                                            value={question.marks || 1}
                                            onChange={(e) => updateQuestionMarks(question._id, e.target.value)}
                                            className="w-20"
                                          />
                                        </div>
                                      </div>
                                    </div>
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
                )}

                {/* Question Bank */}
                {showQuestionBank && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t"
                  >
                    <h4 className="font-medium text-gray-900 mb-3">Available Questions</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableQuestions.map((question) => (
                        <div
                          key={question._id}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addQuestion(question)}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {question.question}
                            </p>
                            <Badge variant="outline" className="ml-2">
                              {question.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Exam Status */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Submissions:</span>
                    <span className="text-sm font-medium">{exam.attempts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm">{new Date(exam.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowRetake" className="text-sm">Allow Retake</Label>
                  <input
                    id="allowRetake"
                    type="checkbox"
                    checked={formData.settings.allowRetake}
                    onChange={(e) => handleSettingChange('allowRetake', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showResults" className="text-sm">Show Results</Label>
                  <input
                    id="showResults"
                    type="checkbox"
                    checked={formData.settings.showResults}
                    onChange={(e) => handleSettingChange('showResults', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomizeQuestions" className="text-sm">Randomize Questions</Label>
                  <input
                    id="randomizeQuestions"
                    type="checkbox"
                    checked={formData.settings.randomizeQuestions}
                    onChange={(e) => handleSettingChange('randomizeQuestions', e.target.checked)}
                    className="rounded"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Questions:</span>
                  <span className="text-sm font-medium">{formData.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Marks:</span>
                  <span className="text-sm font-medium">{totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Passing Marks:</span>
                  <span className="text-sm font-medium">{formData.passingMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium">{formData.duration} min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default EditExam;
