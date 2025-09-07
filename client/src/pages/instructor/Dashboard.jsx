import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'wouter';
import { FileText, Users, TrendingUp, Clock, Plus, Database, BarChart3, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InstructorLayout from '../../layouts/InstructorLayout';
import { instructorExamAPI } from '../../api/instructorExams';

const InstructorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalExams: 0,
      totalAttempts: 0,
      avgScore: 0,
      pendingGrades: 0
    },
    recentExams: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await instructorExamAPI.getDashboardStats(user.id);
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const { stats, recentExams } = dashboardData;

  const StatCard = ({ icon: Icon, title, value, iconColor }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
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
          return 'bg-green-100 text-green-800';
        case 'completed':
          return 'bg-blue-100 text-blue-800';
        case 'draft':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case 'published':
          return 'Published';
        case 'upcoming':
          return 'Upcoming';
        case 'completed':
          return 'Completed';
        case 'draft':
          return 'Draft';
        default:
          return status;
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
              <p className="text-sm text-muted-foreground">
                {exam.subject} • {exam.questionsCount || 0} Questions • {exam.totalMarks || 0} Marks
              </p>
              {exam.scheduledDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled: {new Date(exam.scheduledDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
              {getStatusLabel(exam.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{exam.duration || 0}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{exam.attemptsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {exam.averageScore ? `${exam.averageScore}%` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1" data-testid={`button-view-results-${exam.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
            <Link href={`/instructor/exam/${exam.id}/edit`}>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Exam
              </Button>
            </Link>
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
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Examinations</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
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
            ) : recentExams.length > 0 ? (
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Exams Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first exam to get started.</p>
                  <Link href="/instructor/exam/create">
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
              
              <Link href="/instructor/analytics">
                <QuickActionCard
                  icon={BarChart3}
                  title="Analytics"
                  description="View detailed analytics"
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
