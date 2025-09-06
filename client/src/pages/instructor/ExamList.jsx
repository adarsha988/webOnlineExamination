import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Send, 
  Clock, 
  Users, 
  FileText,
  Calendar,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import InstructorLayout from '../../layouts/InstructorLayout';
import { fetchExams, deleteExam } from '../../store/examSlice';
import api from '../../api/axios';

const ExamList = () => {
  const dispatch = useDispatch();
  const { exams, isLoading } = useSelector((state) => state.exam);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadExams();
    }
  }, [user?.id, activeTab, searchTerm, currentPage]);

  const loadExams = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: activeTab === 'all' ? '' : activeTab,
        search: searchTerm
      });
      
      const response = await api.get(`/api/exams/instructor/${user.id}?${params}`);
      dispatch({ type: 'exam/fetchExams/fulfilled', payload: response.data });
    } catch (error) {
      console.error('Error loading exams:', error);
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    }
  };

  const handlePublishExam = async () => {
    if (!selectedExam) return;
    
    setActionLoading(true);
    try {
      await api.patch(`/api/exams/${selectedExam._id}/publish`);
      toast({
        title: "Success",
        description: "Exam published successfully",
      });
      setPublishModalOpen(false);
      loadExams();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to publish exam",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/api/exams/${selectedExam._id}`);
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      setDeleteModalOpen(false);
      loadExams();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete exam",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      published: { variant: 'default', label: 'Published' },
      completed: { variant: 'outline', label: 'Completed' },
      inactive: { variant: 'destructive', label: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredExams = Array.isArray(exams?.exams) ? exams.exams : [];
  const examCounts = {
    all: filteredExams.length,
    draft: filteredExams.filter(exam => exam.status === 'draft').length,
    published: filteredExams.filter(exam => exam.status === 'published').length,
    completed: filteredExams.filter(exam => exam.status === 'completed').length
  };

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Exams</h1>
            <p className="text-gray-600 mt-1">Manage your exams and track student progress</p>
          </div>
          <Link href="/instructor/exam-creation">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search exams by title or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({examCounts.all})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({examCounts.draft})</TabsTrigger>
            <TabsTrigger value="published">Published ({examCounts.published})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({examCounts.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredExams.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams found</h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'all' 
                      ? "You haven't created any exams yet." 
                      : `No ${activeTab} exams found.`}
                  </p>
                  <Link href="/instructor/exam-creation">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Exam
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredExams.map((exam) => (
                    <motion.div
                      key={exam._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {exam.title}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{exam.subject}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/instructor/exams/${exam._id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                </Link>
                                <Link href={`/instructor/exams/${exam._id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Exam
                                  </DropdownMenuItem>
                                </Link>
                                {exam.status === 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedExam(exam);
                                      setPublishModalOpen(true);
                                    }}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Publish
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExam(exam);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(exam.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(exam.scheduledDate)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {exam.duration} minutes
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2" />
                              {exam.questions?.length || 0} questions
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2" />
                              {exam.attempts?.length || 0} submissions
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {exams?.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {currentPage} of {exams.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(exams.totalPages, prev + 1))}
              disabled={currentPage === exams.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Publish Confirmation Modal */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish "{selectedExam?.title}"? Once published, students will be able to take this exam.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublishExam} disabled={actionLoading}>
              {actionLoading ? 'Publishing...' : 'Publish Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Exam
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedExam?.title}"? This action cannot be undone.
              {selectedExam?.attempts?.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  Warning: This exam has {selectedExam.attempts.length} student submission(s).
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExam} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InstructorLayout>
  );
};

export default ExamList;
