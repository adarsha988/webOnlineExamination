import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'wouter';
import { FileText, Users, TrendingUp, Clock, Plus, Database, BarChart3, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InstructorLayout from '../../layouts/InstructorLayout';
import { fetchExams } from '../../store/examSlice';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const { exams, isLoading } = useSelector((state) => state.exam);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);

  // Filter exams for current instructor
  const instructorExams = exams.filter(exam => exam.instructorId === user?.id);
  const recentExams = instructorExams.slice(0, 4);

  // Calculate stats
  const stats = {
    totalExams: instructorExams.length,
    totalStudents: instructorExams.reduce((sum, exam) => sum + (exam.assignedStudents?.length || 0), 0),
    avgScore: 82, // This would be calculated from actual attempt data
    pendingGrades: Math.floor(Math.random() * 30) + 10,
  };

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
    const assignedCount = exam.assignedStudents?.length || 0;
    const completedCount = Math.floor(assignedCount * 0.7); // Mock completion rate
    const avgScore = Math.floor(Math.random() * 20) + 75; // Mock average score

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
              <p className="text-sm text-muted-foreground">{exam.subject} • {exam.totalQuestions || 0} Questions</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              exam.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
            }`}>
              {exam.status === 'active' ? 'Active' : 'Draft'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{assignedCount}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{exam.status === 'active' ? `${avgScore}%` : '-'}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1" data-testid={`button-view-results-${exam.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
            <Link href={`/instructor/exam/${exam.id}/questions`}>
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
          <Link href="/instructor/exam/create">
            <Button className="flex items-center" data-testid="button-create-exam">
              <Plus className="h-4 w-4 mr-2" />
              Create New Exam
            </Button>
          </Link>
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
            title="Students"
            value={stats.totalStudents}
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
              <QuickActionCard
                icon={Plus}
                title="New Exam"
                description="Start creating a new examination"
                action={() => window.location.href = '/instructor/exam/create'}
                variant="default"
              />
              
              <QuickActionCard
                icon={Database}
                title="View Bank"
                description="Manage your question library"
                action={() => {}}
              />
              
              <QuickActionCard
                icon={BarChart3}
                title="Analytics"
                description="View detailed analytics"
                action={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};

export default InstructorDashboard;
