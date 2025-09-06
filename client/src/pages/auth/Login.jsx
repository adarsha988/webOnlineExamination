import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { loginUser, clearError } from '../../store/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    console.log('🔄 LOGIN COMPONENT - Auth state changed:', { 
      isAuthenticated, 
      user, 
      userRole: user?.role 
    });
    
    if (isAuthenticated && user) {
      console.log('🚀 REDIRECTING USER - Role:', user.role);
      // Redirect based on user role
      if (user.role === 'admin') {
        console.log('👑 Redirecting to admin dashboard');
        setLocation('/admin/dashboard');
      } else if (user.role === 'instructor') {
        console.log('👨‍🏫 Redirecting to instructor dashboard');
        setLocation('/instructor/dashboard');
      } else {
        console.log('👨‍🎓 Redirecting to student dashboard');
        setLocation('/student/dashboard');
      }
    } else {
      console.log('❌ No redirect - isAuthenticated:', isAuthenticated, 'user:', !!user);
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (error && error !== null) {
      toast({
        title: 'Login Failed',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 FORM SUBMITTED:', { email: formData.email, password: '***' });
    dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }));
  };

  const demoAccounts = [
    { type: 'Student', email: 'stu1@example.com', password: 'stu123' },
    { type: 'Instructor', email: 'inst@example.com', password: 'inst123' },
    { type: 'Admin', email: 'admin@example.com', password: 'admin123' },
  ];

  const fillDemoAccount = (email, password) => {
    setFormData(prev => ({ ...prev, email, password }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <GraduationCap className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="text-3xl font-bold text-foreground">Online Examination System</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard</p>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="mt-1"
                data-testid="input-email"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="mt-1"
                data-testid="input-password"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, remember: checked }))
                  }
                />
                <Label htmlFor="remember" className="text-sm text-foreground">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm text-primary hover:text-primary/80">
                Forgot password?
              </a>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Demo Accounts</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {demoAccounts.map((account) => (
                <div
                  key={account.type}
                  className="text-center p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  data-testid={`demo-${account.type.toLowerCase()}`}
                >
                  <div className="font-medium">{account.type}</div>
                  <div className="text-muted-foreground">{account.email}</div>
                  <div className="text-muted-foreground">{account.password}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
