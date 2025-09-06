import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Plus, Search, Filter, Edit, Trash2, Eye, Users, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ExamsPage = () => {
  const [, setLocation] = useLocation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Mock exam data
  const mockExams = [
    {
      id: 1,
      title: 'Mathematics Final Exam',
      subject: 'Mathematics',
      instructor: 'Dr. John Smith',
      duration: 120,
      totalQuestions: 50,
      maxMarks: 100,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      enrolledStudents: 45,
      completedStudents: 32,
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      title: 'Physics Midterm',
      subject: 'Physics',
      instructor: 'Prof. Sarah Johnson',
      duration: 90,
      totalQuestions: 40,
      maxMarks: 80,
      status: 'scheduled',
      startDate: '2024-01-25',
      endDate: '2024-01-30',
      enrolledStudents: 38,
      completedStudents: 0,
      createdAt: '2024-01-12'
    },
    {
      id: 3,
      title: 'Chemistry Lab Assessment',
      subject: 'Chemistry',
      instructor: 'Dr. Michael Brown',
      duration: 60,
      totalQuestions: 25,
      maxMarks: 50,
      status: 'completed',
      startDate: '2024-01-05',
      endDate: '2024-01-10',
      enrolledStudents: 42,
      completedStudents: 42,
      createdAt: '2024-01-01'
    },
    {
      id: 4,
      title: 'English Literature Quiz',
      subject: 'English',
      instructor: 'Ms. Emily Davis',
      duration: 45,
      totalQuestions: 30,
      maxMarks: 60,
      status: 'draft',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      enrolledStudents: 0,
      completedStudents: 0,
      createdAt: '2024-01-14'
    },
    {
      id: 5,
      title: 'Computer Science Programming Test',
      subject: 'Computer Science',
      instructor: 'Dr. Alex Wilson',
      duration: 180,
      totalQuestions: 35,
      maxMarks: 120,
      status: 'active',
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      enrolledStudents: 55,
      completedStudents: 28,
      createdAt: '2024-01-08'
    }
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exams?limit=100');
      const data = await response.json();
      
      if (response.ok) {
        setExams(data.exams || []);
      } else {
        console.error('Failed to fetch exams:', data.message);
        // Fallback to mock data if API fails
        setExams(mockExams);
        toast({
          title: "Warning",
          description: "Using sample data. Connect to database for real exam data.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      // Fallback to mock data if API fails
      setExams(mockExams);
      toast({
        title: "Warning",
        description: "Using sample data. Connect to database for real exam data.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      scheduled: 'secondary',
      completed: 'outline',
      draft: 'destructive'
    };
    const colors = {
      active: 'text-green-700 bg-green-50 border-green-200',
      scheduled: 'text-blue-700 bg-blue-50 border-blue-200',
      completed: 'text-gray-700 bg-gray-50 border-gray-200',
      draft: 'text-orange-700 bg-orange-50 border-orange-200'
    };
    return { variant: variants[status] || 'outline', className: colors[status] };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExamAction = (examId, action) => {
    toast({
      title: "Action Performed",
      description: `${action} action performed on exam ${examId}`,
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
                <p className="text-gray-600">Manage all examinations and assessments</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => toast({ title: "Feature", description: "Create exam functionality coming soon!" })}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{exams.length}</div>
            <p className="text-xs text-muted-foreground">Total Exams</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'scheduled').length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{exams.filter(e => e.status === 'completed').length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exams List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Examinations</h2>
              <p className="text-sm text-gray-600">Manage and monitor exam activities</p>
            </div>
            <Badge variant="outline" className="text-sm mt-2 md:mt-0">
              {filteredExams.length} exams found
            </Badge>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search exams by title, subject, or instructor..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Details</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam, index) => {
                const statusBadge = getStatusBadge(exam.status);
                return (
                  <motion.tr
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{exam.title}</div>
                        <div className="text-sm text-gray-500">{exam.subject} • {exam.totalQuestions} questions • {exam.maxMarks} marks</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{exam.instructor}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {exam.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-gray-900">{exam.completedStudents}/{exam.enrolledStudents}</div>
                        <div className="text-gray-500">completed</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge.className}>
                        {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-gray-900">{formatDate(exam.startDate)}</div>
                        <div className="text-gray-500">to {formatDate(exam.endDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExamAction(exam.id, 'view')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExamAction(exam.id, 'edit')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Exam
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExamAction(exam.id, 'results')}>
                            <Users className="h-4 w-4 mr-2" />
                            View Results
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleExamAction(exam.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Exam
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
};

export default ExamsPage;
