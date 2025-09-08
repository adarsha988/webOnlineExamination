import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp
} from 'lucide-react';
import InstructorLayout from '../../layouts/InstructorLayout';
import ProctoringDashboard from '../../components/proctoring/ProctoringDashboard';
import { proctoringDashboardAPI } from '../../api/proctoringDashboard';

const InstructorProctoringDashboard = () => {
  const { examId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [examInfo, setExamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamInfo();
    }
  }, [examId]);

  const fetchExamInfo = async () => {
    try {
      // Fetch basic exam information
      const response = await fetch(`/api/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExamInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch exam info:', error);
      toast.error('Failed to load exam information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // The ProctoringDashboard component will handle its own refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExportData = async (format = 'csv') => {
    try {
      await proctoringDashboardAPI.exportProctoringData(examId, format);
      toast.success(`Proctoring data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export proctoring data');
    }
  };

  if (loading) {
    return (
      <InstructorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Proctoring Dashboard
              </h1>
              {examInfo && (
                <p className="text-gray-600 mt-1">
                  {examInfo.title} • {examInfo.subject}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('json')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Exam Status Card */}
        {examInfo && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Proctoring Status</p>
                    <p className="font-semibold">
                      {examInfo.aiProctoringEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="font-semibold">{examInfo.assignedStudents?.length || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{examInfo.duration} minutes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={
                      examInfo.status === 'published' ? 'success' :
                      examInfo.status === 'ongoing' ? 'warning' :
                      examInfo.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {examInfo.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Proctoring Dashboard */}
        <ProctoringDashboard examId={examId} key={refreshing ? Date.now() : examId} />

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Proctoring Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Violation Severity Levels</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Info</Badge>
                    <span>Minor behavioral patterns, logging only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Warning</Badge>
                    <span>Suspicious activity requiring attention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Critical</Badge>
                    <span>Serious violations requiring immediate review</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risk Score Interpretation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>0-39%: Low risk, normal behavior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>40-59%: Medium risk, review recommended</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>60-79%: High risk, detailed review required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>80-100%: Critical risk, investigation needed</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </InstructorLayout>
  );
};

export default InstructorProctoringDashboard;
