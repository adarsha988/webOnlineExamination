import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
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
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { questionBankAPI } from '../../api/questionBank';

const QuestionBank = () => {
  const { toast } = useToast();
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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch questions based on current tab and filters
  const fetchQuestions = async (page = 1) => {
    setLoading(true);
    try {
      let data;
      
      if (activeTab === 'shared' && !selectedBank) {
        // Fetch approved questions from all accessible shared banks
        const params = {
          page,
          limit: 20,
          ...(searchTerm && { search: searchTerm }),
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
        };
        data = await questionBankAPI.getApprovedQuestions(params);
      } else {
        // Fetch questions from specific scope/bank
        const params = {
          page,
          limit: 20,
          scope: activeTab,
          ...(selectedBank && { sharedBankId: selectedBank._id }),
          ...(searchTerm && { search: searchTerm }),
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
        };
        data = await questionBankAPI.getQuestions(params);
      }

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

  // Fetch shared banks
  const fetchSharedBanks = async () => {
    try {
      const data = await questionBankAPI.getSharedBanks();
      setSharedBanks(data.sharedBanks || []);
    } catch (error) {
      console.error('Error fetching shared banks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shared banks. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle file import
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await questionBankAPI.importQuestions(
        importFile,
        activeTab,
        selectedBank?._id
      );

      toast({
        title: "Import Successful",
        description: `Imported ${result.summary.imported} questions. ${result.summary.errors > 0 ? `${result.summary.errors} errors occurred.` : ''}`
      });

      setShowImportDialog(false);
      setImportFile(null);
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import questions. Please check your file format.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = {
        format: exportFormat,
        scope: activeTab,
        ...(selectedBank && { sharedBankId: selectedBank._id }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };

      await questionBankAPI.exportQuestions(params);
      
      toast({
        title: "Export Successful",
        description: "Questions exported successfully."
      });

      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export questions.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async (format) => {
    try {
      await questionBankAPI.downloadTemplate(format);
      toast({
        title: "Template Downloaded",
        description: `Import template (${format.toUpperCase()}) downloaded successfully.`
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template.",
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
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import Questions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select File</label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate('csv')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    CSV Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadTemplate('xlsx')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Excel Template
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!importFile || isImporting}>
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Questions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Export will include questions based on current filters and scope.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
            <div className="space-y-6">
              {/* Approved Questions from All Shared Banks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Approved Questions from Shared Banks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Browse approved questions from shared banks you have access to
                  </p>
                </CardHeader>
              </Card>

              {/* Search and Filters for Approved Questions */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search approved questions..."
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

              {/* Approved Questions List */}
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
                                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Approved
                                </Badge>
                                {question.sharedBank && (
                                  <Badge variant="outline" className="text-xs">
                                    {question.sharedBank.name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {question.questionText}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Marks: {question.marks}</span>
                                <span>By: {question.createdBy?.name}</span>
                                <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
                                {question.sharedBank && (
                                  <span>Bank: {question.sharedBank.name}</span>
                                )}
                              </div>
                              {question.tags && question.tags.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {question.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-blue-600">
                                <Plus className="w-4 h-4 mr-1" />
                                Use in Exam
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Show message if no approved questions */}
              {!loading && questions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Approved Questions Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No approved questions are available from shared banks you have access to.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Shared Banks List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Available Shared Banks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Shared question banks you can collaborate on
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sharedBanks.map(bank => (
                      <Card 
                        key={bank._id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200"
                        onClick={() => setSelectedBank(bank)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{bank.name}</h4>
                            <Badge variant={bank.userPermissions?.isOwner ? 'default' : 'secondary'} className="text-xs">
                              {bank.userPermissions?.isOwner ? 'Owner' : 'Member'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{bank.description}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Subject:</span>
                              <Badge variant="outline" className="text-xs">{bank.subject}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Questions:</span>
                              <span>{bank.stats?.totalQuestions || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {sharedBanks.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No shared banks available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
