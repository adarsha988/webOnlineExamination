import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, Link } from 'wouter';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { registerUser, clearError } from '../../store/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (user.role === 'instructor') {
        setLocation('/instructor/dashboard');
      } else {
        setLocation('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (error && error !== null) {
      toast({
        title: 'Registration Failed',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    dispatch(registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <GraduationCap className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="text-3xl font-bold text-foreground">Create Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Join the examination system</p>
        </div>
        
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="mt-1"
                data-testid="input-name"
              />
            </div>
            
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
              <Label htmlFor="role" className="block text-sm font-medium text-foreground">
                Role
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="mt-1" data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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
            
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="mt-1"
                data-testid="input-confirm-password"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
