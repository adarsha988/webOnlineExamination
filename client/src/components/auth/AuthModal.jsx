import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loginUser, registerUser, clearError } from '../../store/authSlice';

const AuthModal = ({ isOpen, onClose, mode, onModeChange }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  useEffect(() => {
    // Reset form when modal opens/closes or mode changes
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student'
      });
      setShowPassword(false);
    }
  }, [isOpen, mode]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'login') {
      dispatch(loginUser({
        email: formData.email,
        password: formData.password
      }));
    } else {
      dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      }));
    }
  };

  const switchMode = () => {
    onModeChange(mode === 'login' ? 'signup' : 'login');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="auth-name" className="text-gray-700">Full Name</Label>
                  <Input
                    id="auth-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="auth-email" className="text-gray-700">Email Address</Label>
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="auth-password" className="text-gray-700">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="pr-10"
                    placeholder="Enter your password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <Label htmlFor="auth-role" className="text-gray-700">Role</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange} name="role">
                    <SelectTrigger className="mt-1" id="auth-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={switchMode}
                  className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Admin: admin@example.com / admin123</div>
                <div>Instructor: inst@example.com / inst123</div>
                <div>Student: stu1@example.com / stu123</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
