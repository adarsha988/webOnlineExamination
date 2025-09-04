import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { Save, FileText, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import InstructorLayout from '../../layouts/InstructorLayout';
import { createExam } from '../../store/examSlice';

const ExamCreator = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isLoading } = useSelector((state) => state.exam);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    scheduledDate: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({ ...prev, subject }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const examData = {
        ...formData,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,
      };
      
      const result = await dispatch(createExam(examData)).unwrap();
      
      toast({
        title: 'Exam Created',
        description: 'Your exam has been created successfully.',
      });
      
      // Redirect to question builder
      setLocation(`/instructor/exam/${result.id}/questions`);
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: error || 'Failed to create exam. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      const examData = {
        ...formData,
        status: 'draft',
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,
      };
      
      await dispatch(createExam(examData)).unwrap();
      
      toast({
        title: 'Draft Saved',
        description: 'Your exam has been saved as a draft.',
      });
      
      setLocation('/instructor/dashboard');
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error || 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'English',
    'Geography',
    'Economics',
    'Psychology'
  ];

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Examination</h1>
          <p className="text-muted-foreground">Set up your exam details and configuration</p>
        </div>

        {/* Exam Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Exam Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Exam Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter exam title"
                    className="mt-1"
                    data-testid="input-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                    Subject *
                  </Label>
                  <Select value={formData.subject} onValueChange={handleSubjectChange}>
                    <SelectTrigger className="mt-1" data-testid="select-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium text-foreground">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    max="480"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="120"
                    className="mt-1"
                    data-testid="input-duration"
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalMarks" className="text-sm font-medium text-foreground">
                    Total Marks
                  </Label>
                  <Input
                    id="totalMarks"
                    name="totalMarks"
                    type="number"
                    min="1"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="mt-1"
                    data-testid="input-total-marks"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="scheduledDate" className="text-sm font-medium text-foreground">
                    Scheduled Date & Time
                  </Label>
                  <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    className="mt-1"
                    data-testid="input-scheduled-date"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description & Instructions
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter exam description and instructions for students"
                  className="mt-1"
                  data-testid="textarea-description"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  data-testid="button-save-draft"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-create-exam"
                >
                  {isLoading ? 'Creating...' : 'Create & Add Questions'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Exam Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formData.title || 'Exam Title'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formData.duration} minutes
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Marks</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formData.totalMarks} points
                  </p>
                </div>
              </div>
            </div>
            
            {formData.description && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm text-foreground">{formData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InstructorLayout>
  );
};

export default ExamCreator;
