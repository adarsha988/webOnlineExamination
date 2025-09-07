import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  User,
  Calendar,
  BookOpen,
  BarChart3,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const QuestionReview = () => {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    type: '',
    sharedBankId: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [feedback, setFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);

  // Fetch pending questions
  const fetchPendingQuestions = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/questions/pending?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pending questions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching pending questions:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQuestions();
  }, [searchTerm, filters]);

  // Handle single question approval
  const handleApproveQuestion = async (questionId, feedbackText = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/questions/${questionId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback: feedbackText })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question approved successfully"
        });
        fetchPendingQuestions(pagination.currentPage);
        setSelectedQuestion(null);
        setFeedback('');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to approve question",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving question:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle single question rejection
  const handleRejectQuestion = async (questionId, reason) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/questions/${questionId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question rejected successfully"
        });
        fetchPendingQuestions(pagination.currentPage);
        setSelectedQuestion(null);
        setRejectionReason('');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to reject question",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rejecting question:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (bulkSelected.length === 0) {
      toast({
        title: "Error",
        description: "No questions selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/questions/bulk-approve', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          questionIds: bulkSelected,
          feedback: feedback 
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `${data.approvedCount} questions approved successfully`
        });
        fetchPendingQuestions(pagination.currentPage);
        setBulkSelected([]);
        setFeedback('');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to approve questions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error bulk approving questions:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      suggested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
      draft: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: 'Draft' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const toggleBulkSelection = (questionId) => {
    setBulkSelected(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Review</h1>
          <p className="text-gray-600 mt-1">Review and approve shared questions from instructors</p>
        </div>
        <div className="flex gap-3">
          {bulkSelected.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Bulk Approve ({bulkSelected.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Approve Questions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Are you sure you want to approve {bulkSelected.length} selected questions?</p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Feedback (Optional)</label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add feedback for the approved questions..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setFeedback('')}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkApprove}>
                      Approve All
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
            <select
              value={filters.subject}
              onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="mcq">Multiple Choice</option>
              <option value="truefalse">True/False</option>
              <option value="short">Short Answer</option>
              <option value="long">Long Answer</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Questions</h3>
              <p className="text-gray-600">All shared questions have been reviewed.</p>
            </CardContent>
          </Card>
        ) : (
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
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={bulkSelected.includes(question._id)}
                        onChange={() => toggleBulkSelection(question._id)}
                        className="mt-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{question.subject}</Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="secondary">{question.type}</Badge>
                          {getStatusBadge(question.status)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {question.questionText}
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{question.createdBy?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{question.sharedBankId?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span>Marks: {question.marks}</span>
                        </div>
                        
                        {/* Show options for MCQ */}
                        {question.type === 'mcq' && question.options && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                            <div className="space-y-1">
                              {question.options.map((option, idx) => (
                                <div key={idx} className={`text-sm p-2 rounded ${
                                  option === question.correctAnswer 
                                    ? 'bg-green-100 text-green-800 font-medium' 
                                    : 'bg-gray-50'
                                }`}>
                                  {String.fromCharCode(65 + idx)}. {option}
                                  {option === question.correctAnswer && ' ✓'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show correct answer for other types */}
                        {question.type !== 'mcq' && question.correctAnswer && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                            <p className="text-sm bg-green-50 p-2 rounded">{question.correctAnswer}</p>
                          </div>
                        )}

                        {/* Show explanation if available */}
                        {question.explanation && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Explanation:</p>
                            <p className="text-sm bg-blue-50 p-2 rounded">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedQuestion(question);
                                setActionType('approve');
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Question</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Are you sure you want to approve this question?</p>
                              <div>
                                <label className="block text-sm font-medium mb-2">Feedback (Optional)</label>
                                <Textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Add feedback for the instructor..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => {
                                  setSelectedQuestion(null);
                                  setFeedback('');
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleApproveQuestion(question._id, feedback)}>
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedQuestion(question);
                                setActionType('reject');
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Question</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Please provide a reason for rejecting this question:</p>
                              <div>
                                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Explain why this question is being rejected..."
                                  rows={4}
                                  required
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => {
                                  setSelectedQuestion(null);
                                  setRejectionReason('');
                                }}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleRejectQuestion(question._id, rejectionReason)}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => fetchPendingQuestions(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchPendingQuestions(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionReview;
