import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'wouter';
import { FileText, Users, TrendingUp, Clock, Plus, Database, Eye, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import InstructorLayout from '../../layouts/InstructorLayout';
import { instructorExamAPI } from '../../api/instructorExams';

const InstructorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalAttempts: 0,
    avgScore: 0,
    pendingGrades: 0
  });
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Starting to fetch dashboard data...');
        console.log('📍 User ID:', user.id);
        console.log('📍 API Base URL:', 'http://localhost:5000/api');
        
        // Fetch both stats and exams
        console.log('📡 Calling API endpoints:');
        console.log('  - Stats: /api/exams/instructor/' + user.id + '/analytics');
        console.log('  - Exams: /api/exams/instructor/' + user.id);
        
        const [statsResponse, examsResponse] = await Promise.all([
          instructorExamAPI.getDashboardStats(user.id),
          instructorExamAPI.getInstructorExams(user.id, { limit: 10 })
        ]);
        
        console.log('✅ API Responses received:');
        console.log('📊 Stats Response:', statsResponse);
        console.log('📋 Exams Response:', examsResponse);
        console.log('📋 Exams Array:', examsResponse?.exams);
        console.log('📋 Exams Length:', examsResponse?.exams?.length || 0);
        
        setStats(statsResponse);
        setExams(examsResponse?.exams || examsResponse || []);
        
        console.log('✅ State updated successfully');
      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
        console.error('❌ Error details:', {
          message: err.message,
          status: err.status,
          response: err.response?.data
        });
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
        console.log('🏁 Dashboard data fetch completed');
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const StatCard = ({ icon: Icon, title, value, iconColor }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
            ) : error ? (
              <p className="text-2xl font-bold text-red-500">--</p>
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  const ExamCard = ({ exam }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'published':
        case 'upcoming':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'completed':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'draft':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        case 'ongoing':
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      }
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
              <p className="text-sm text-muted-foreground">
                {exam.subject} • {exam.questionsCount || 0} Questions • {exam.totalMarks || 0} Marks
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
              {exam.status}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{exam.duration || 0}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{exam.attemptsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">
                {exam.averageScore ? `${exam.averageScore}%` : '-'}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(exam.status)}`}>
                    {exam.status}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {exam.attempts || 0} attempts
                  </span>
                  {exam.aiProctoringEnabled && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Proctored
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {exam.aiProctoringEnabled && (
                    <Link href={`/instructor/exam/${exam.id || exam._id}/proctoring`}>
                      <Button variant="ghost" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Proctoring
                      </Button>
                    </Link>
                  )}
                  <Link href={`/instructor/exam/${exam.id || exam._id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickActionCard = ({ icon: Icon, title, description, action, variant = "outline" }) => (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <Button variant={variant} size="sm" className="w-full" onClick={action}>
          <Icon className="h-4 w-4 mr-2" />
          {title}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <InstructorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
            <p className="text-muted-foreground">Manage your examinations and track student progress</p>
          </div>
          <div className="flex gap-2">
            <Link href="/instructor/exams">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All Exams
              </Button>
            </Link>
            <Link href="/instructor/exam-creation">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            title="Total Exams"
            value={stats.totalExams}
            iconColor="text-primary"
          />
          <StatCard
            icon={Users}
            title="Total Attempts"
            value={stats.totalAttempts}
            iconColor="text-secondary"
          />
          <StatCard
            icon={TrendingUp}
            title="Avg Score"
            value={`${stats.avgScore}%`}
            iconColor="text-accent"
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={stats.pendingGrades}
            iconColor="text-destructive"
          />
        </div>

        {/* Recent Exams and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Exams */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Exams</h2>
              <p className="text-sm text-muted-foreground">Latest exams from database</p>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="h-6 bg-muted rounded mb-1"></div>
                          <div className="h-2 bg-muted rounded"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-6 bg-muted rounded mb-1"></div>
                          <div className="h-2 bg-muted rounded"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-6 bg-muted rounded mb-1"></div>
                          <div className="h-2 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-muted rounded flex-1"></div>
                        <div className="h-8 bg-muted rounded flex-1"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-red-500 mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Exams</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : exams.length > 0 ? (
              <div className="space-y-4">
                {exams.slice(0, 5).map((exam) => (
                  <ExamCard key={exam.id || exam._id} exam={exam} />
                ))}
                {exams.length > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/instructor/exams">
                      <Button variant="outline">
                        View All {exams.length} Exams
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Exams Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first exam to get started.</p>
                  <Link href="/instructor/exam-creation">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link href="/instructor/exam-creation">
                <QuickActionCard
                  icon={Plus}
                  title="New Exam"
                  description="Start creating a new examination"
                  action={() => {}}
                  variant="default"
                />
              </Link>
              
              <Link href="/instructor/question-bank">
                <QuickActionCard
                  icon={Database}
                  title="View Bank"
                  description="Manage your question library"
                  action={() => {}}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
