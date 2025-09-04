import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'wouter';
import { Clock, CheckCircle, Percent, Trophy, Calendar, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StudentLayout from '../../layouts/StudentLayout';
import { fetchExams } from '../../store/examSlice';
import { fetchResults } from '../../store/attemptSlice';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { exams, isLoading: examsLoading } = useSelector((state) => state.exam);
  const { results } = useSelector((state) => state.attempt);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchResults());
  }, [dispatch]);

  // Filter exams for current student
  const upcomingExams = exams.filter(exam => 
    exam.status === 'active' && 
    exam.assignedStudents?.includes(user?.id)
  );

  const recentResults = results.slice(0, 5);

  // Calculate stats
  const stats = {
    upcoming: upcomingExams.length,
    completed: results.length,
    avgScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0,
    bestScore: results.length > 0 ? Math.max(...results.map(r => r.score)) : 0,
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

  const ExamCard = ({ exam }) => (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
            <p className="text-sm text-muted-foreground">{exam.subject}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
            Upcoming
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(exam.scheduledDate).toLocaleDateString()} at {new Date(exam.scheduledDate).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{exam.duration} minutes</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span>{exam.totalQuestions || 0} questions</span>
          </div>
        </div>
        
        <Link href={`/student/exam/${exam.id}`}>
          <Button className="w-full" data-testid={`button-start-exam-${exam.id}`}>
            Start Exam
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground">Here are your upcoming and completed examinations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Clock}
            title="Upcoming"
            value={stats.upcoming}
            iconColor="text-accent"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={stats.completed}
            iconColor="text-secondary"
          />
          <StatCard
            icon={Percent}
            title="Avg Score"
            value={`${stats.avgScore}%`}
            iconColor="text-primary"
          />
          <StatCard
            icon={Trophy}
            title="Best Score"
            value={`${stats.bestScore}%`}
            iconColor="text-accent"
          />
        </div>

        {/* Upcoming Exams */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Examinations</h2>
          {examsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingExams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Exams</h3>
                <p className="text-muted-foreground">You don't have any exams scheduled at the moment.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Results */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Results</h2>
            <Link href="/student/results">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {recentResults.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Exam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {recentResults.map((result) => (
                        <tr key={result.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-foreground">{result.examTitle}</div>
                              <div className="text-sm text-muted-foreground">{result.subject}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(result.completedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-foreground">{result.score}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link href={`/student/results?attempt=${result.id}`}>
                              <Button variant="ghost" size="sm">View Details</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">Complete an exam to see your results here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
