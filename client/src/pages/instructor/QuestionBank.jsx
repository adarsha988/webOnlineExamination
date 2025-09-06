import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  Edit,
  Trash2,
  Eye,
  Users,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionBank = () => {
  const [activeTab, setActiveTab] = useState('private');
  const [questions, setQuestions] = useState([]);
  const [sharedBanks, setSharedBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    type: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch questions based on current tab and filters
  const fetchQuestions = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        scope: activeTab,
        ...(selectedBank && { sharedBankId: selectedBank._id }),
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch shared banks
  const fetchSharedBanks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shared-banks', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSharedBanks(data.sharedBanks);
      }
    } catch (error) {
      console.error('Error fetching shared banks:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    if (activeTab === 'shared') {
      fetchSharedBanks();
    }
  }, [activeTab, selectedBank, searchTerm, filters]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      suggested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      draft: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600 mt-1">Manage your private and shared question collections</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Question
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            My Questions
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Shared Banks
          </TabsTrigger>
        </TabsList>

        {/* Private Questions Tab */}
        <TabsContent value="private" className="space-y-6">
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
                            {question.scope === 'shared' && getStatusBadge(question.status)}
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
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
        </TabsContent>

        {/* Shared Banks Tab */}
        <TabsContent value="shared" className="space-y-6">
          {!selectedBank ? (
            // Shared Banks List
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedBanks.map(bank => (
                <Card 
                  key={bank._id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => setSelectedBank(bank)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {bank.name}
                      <Badge variant={bank.userPermissions.isOwner ? 'default' : 'secondary'}>
                        {bank.userPermissions.isOwner ? 'Owner' : 'Collaborator'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{bank.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subject:</span>
                        <Badge variant="outline">{bank.subject}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Questions:</span>
                        <span>{bank.stats.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Members:</span>
                        <span>{bank.owners.length + bank.collaborators.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Selected Bank Questions
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedBank.name}</CardTitle>
                      <p className="text-gray-600">{selectedBank.description}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedBank(null)}>
                      Back to Banks
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Same questions list as private tab */}
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
                                {getStatusBadge(question.status)}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {question.questionText}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Marks: {question.marks}</span>
                                <span>By: {question.createdBy?.name}</span>
                                <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {selectedBank.userPermissions.canEdit && (
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {selectedBank.userPermissions.canApprove && question.status === 'suggested' && (
                                <Button variant="ghost" size="sm" className="text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionBank;
