import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ReportsSection = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState('last_30_days');
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?dateRange=${dateRange}`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [usage, performance, security] = await Promise.all([
        fetch(`/api/reports/usage-analytics?dateRange=${dateRange}`).then(res => res.json()),
        fetch(`/api/reports/academic-performance?dateRange=${dateRange}`).then(res => res.json()),
        fetch(`/api/reports/security-audit?dateRange=${dateRange}`).then(res => res.json())
      ]);

      setAnalytics({
        usage: usage.data || {},
        performance: performance.data || {},
        security: security.data || {}
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          dateRange,
          title: `${type.replace('_', ' ').toUpperCase()} Report - ${new Date().toLocaleDateString()}`
        }),
      });

      if (response.ok) {
        const newReport = await response.json();
        toast({
          title: "Report Generated",
          description: `${type.replace('_', ' ')} report has been generated successfully`,
          variant: "default"
        });
        fetchReports();
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const downloadReport = async (reportId, format = 'pdf') => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: `Report download started as ${format.toUpperCase()}`,
          variant: "default"
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive"
      });
    }
  };

  const reportTypes = [
    {
      id: 'usage_analytics',
      title: 'Usage Analytics',
      description: 'System usage patterns and user activity',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      id: 'academic_performance',
      title: 'Academic Performance',
      description: 'Student performance and exam statistics',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'security_audit',
      title: 'Security Audit',
      description: 'Security events and access logs',
      icon: FileText,
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600">Generate and view system reports</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_year">Last Year</option>
            </select>
            <Button
              onClick={() => {
                fetchReports();
                fetchAnalytics();
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">
                  {analytics.usage?.totalUsers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Exams</p>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.performance?.activeExams || 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Avg Score</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {analytics.performance?.averageScore || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Security Events</p>
                <p className="text-2xl font-bold text-red-900">
                  {analytics.security?.totalEvents || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Generate Reports */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => generateReport(type.id)}
                    className="w-full"
                    size="sm"
                  >
                    Generate Report
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Existing Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          <Badge variant="outline">
            {reports.length} reports
          </Badge>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports generated yet</p>
            <p className="text-sm text-gray-500">Generate your first report using the options above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>Generated {new Date(report.createdAt).toLocaleDateString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {report.type?.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadReport(report.id, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedReport.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Type: {selectedReport.type?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>Generated: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Status: {selectedReport.status}</span>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                  {JSON.stringify(selectedReport.data, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReportsSection;
