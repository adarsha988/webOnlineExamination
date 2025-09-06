import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck, 
  Mail, 
  Phone, 
  Calendar,
  MoreVertical,
  Eye,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EditUserModal from './EditUserModal';
import CreateUserModal from './CreateUserModal';

const UserManagement = ({ searchQuery = '', defaultRole = 'all' }) => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const { toast } = useToast();

  // Load all users once on component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Filter users locally when search, role, or status changes
  useEffect(() => {
    filterUsers();
  }, [localSearchQuery, selectedRole, selectedStatus, allUsers]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?limit=1000'); // Fetch all users
      const data = await response.json();
      
      if (response.ok) {
        setAllUsers(data.users || []);
        setTotalUsers(data.total || 0);
      } else {
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    // Filter by search query (name or email)
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    setUsers(paginatedUsers);
    setFilteredUsers(paginatedUsers);
    setTotalPages(Math.ceil(filtered.length / usersPerPage));
  };

  const handleSearch = useCallback((searchTerm) => {
    setLocalSearchQuery(searchTerm);
    setCurrentPage(1);
  }, []);

  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  }, []);

  // Update pagination when page changes
  useEffect(() => {
    filterUsers();
  }, [currentPage]);

  const handleUserAction = async (userId, action) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'deactivate':
          endpoint = `/api/users/${userId}/deactivate`;
          method = 'PUT';
          break;
        case 'reactivate':
          endpoint = `/api/users/${userId}/reactivate`;
          method = 'PUT';
          break;
        case 'delete':
          endpoint = `/api/users/${userId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        await fetchAllUsers();
        toast({
          title: "Success",
          description: `User ${action}d successfully`,
          variant: "default"
        });
      } else {
        fetchAllUsers();
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive"
      });
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'destructive',
      instructor: 'default',
      student: 'secondary'
    };
    return variants[role] || 'outline';
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleResetPassword = async (userId) => {
    try {
      const newPassword = Math.random().toString(36).slice(-8);
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Password reset successfully. New password: ${newPassword}`,
          variant: "default"
        });
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  // Use users directly since pagination is handled by API
  const currentUsers = users;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="flex space-x-4">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Badge variant="outline" className="text-sm">
              {totalUsers} users found
            </Badge>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create New User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                className="pl-10"
                value={localSearchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadge(user.role)}>
                      {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(user.status)}>
                      {user.status?.charAt(0)?.toUpperCase() + user.status?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('View details:', user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {user.status === 'active' ? (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'deactivate')}
                            className="text-orange-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'reactivate')}
                            className="text-green-600"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={() => {
          setEditingUser(null);
          fetchUsers();
        }}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          setShowCreateModal(false);
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UserManagement;
