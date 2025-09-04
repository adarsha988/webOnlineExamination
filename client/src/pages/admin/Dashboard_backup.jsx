import React from 'react';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  return <AdminDashboard />;
};
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    instructors: 0,
    admins: 0,
    totalExams: 0,
    activeExams: 0,
    draftExams: 0,
    activeToday: 0,
    systemLoad: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch admin reports
      const reportsResponse = await apiRequest('GET', '/api/admin/reports');
      const reportsData = await reportsResponse.json();
      setStats({
        ...reportsData,
        activeToday: Math.floor(Math.random() * 200) + 50, // Mock active today
        systemLoad: Math.floor(Math.random() * 30) + 60, // Mock system load
      });

      // Fetch users
      const usersResponse = await apiRequest('GET', '/api/admin/users');
      const usersData = await usersResponse.json();
      setUsers(usersData.slice(0, 5)); // Show only recent 5 users

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          type: 'user_register',
          description: 'New student Sarah Johnson registered',
          timestamp: '2 minutes ago',
          icon: 'user-plus'
        },
        {
          id: 2,
          type: 'exam_publish',
          description: 'Exam Physics Final published',
          timestamp: '15 minutes ago',
          icon: 'file-alt'
        },
        {
          id: 3,
          type: 'exam_complete',
          description: '45 students completed Math Quiz',
          timestamp: '1 hour ago',
          icon: 'check-circle'
        },
        {
          id: 4,
          type: 'user_register',
          description: 'New instructor Dr. Michael Chen registered',
          timestamp: '2 hours ago',
          icon: 'chalkboard-teacher'
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_register':
        return UserPlus;
      case 'exam_publish':
        return FileText;
      case 'exam_complete':
        return TrendingUp;
      default:
        return Users;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_register':
        return 'bg-primary/10 text-primary';
      case 'exam_publish':
        return 'bg-secondary/10 text-secondary';
      case 'exam_complete':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and user management</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            iconColor="text-primary"
          />
          <StatCard
            icon={User}
            title="Students"
            value={stats.students}
            iconColor="text-secondary"
          />
          <StatCard
            icon={GraduationCap}
            title="Instructors"
            value={stats.instructors}
            iconColor="text-accent"
          />
          <StatCard
            icon={FileText}
            title="Total Exams"
            value={stats.totalExams}
            iconColor="text-primary"
          />
          <StatCard
            icon={TrendingUp}
            title="Active Today"
            value={stats.activeToday}
            iconColor="text-secondary"
          />
          <StatCard
            icon={Server}
            title="System Load"
            value={`${stats.systemLoad}%`}
            iconColor="text-accent"
          />
        </div>

        {/* Recent Activity and User Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Users</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                  <Users className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-foreground">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                              user.role === 'instructor' ? 'bg-accent/10 text-accent' :
                              'bg-secondary/10 text-secondary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80">
                                Deactivate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Reports */}
        <Card>
          <CardHeader>
            <CardTitle>System Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border rounded-lg">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Usage Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed system usage statistics and trends
                </p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Report
                </Button>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <GraduationCap className="h-12 w-12 text-secondary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Academic Performance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Student performance metrics and analytics
                </p>
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  View Report
                </Button>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <Server className="h-12 w-12 text-accent mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Security Audit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  System security logs and audit trails
                </p>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  View Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
