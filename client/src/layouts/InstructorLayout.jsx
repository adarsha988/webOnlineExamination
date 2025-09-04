import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'wouter';
import { GraduationCap, LayoutDashboard, FileText, Users, BarChart3, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '../store/authSlice';

const InstructorLayout = ({ children }) => {
  const dispatch = useDispatch();
  const [location] = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'Create Exam', href: '/instructor/exam/create', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">ExamSystem</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 bg-muted rounded-lg p-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="flex items-center space-x-2"
                        data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

export default InstructorLayout;
