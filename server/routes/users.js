import express from 'express';
const router = express.Router();
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// GET /api/users - Get all users with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'student', phone, address } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = config.security.bcryptSaltRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address
    });
    
    await user.save();
    
    // Log activity
    await new Activity({
      user: user._id,
      type: 'user_created',
      description: `New user account created: ${name} (${role})`,
      metadata: { role, email }
    }).save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, phone, address } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    
    await user.save();
    
    // Log activity
    await new Activity({
      user: user._id,
      type: 'user_updated',
      description: `User profile updated: ${user.name}`,
      metadata: { updatedFields: Object.keys(req.body) }
    }).save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// PATCH /api/users/:id/deactivate - Deactivate user
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();
    
    // Log activity
    await new Activity({
      user: user._id,
      type: user.status === 'active' ? 'user_activated' : 'user_deactivated',
      description: `User ${user.status === 'active' ? 'activated' : 'deactivated'}: ${user.name}`,
      metadata: { previousStatus: user.status === 'active' ? 'inactive' : 'active' }
    }).save();
    
    res.json({ 
      message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`, 
      status: user.status 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (soft delete by setting status to inactive)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = 'inactive';
    await user.save();
    
    // Log activity
    await new Activity({
      user: user._id,
      type: 'user_deactivated',
      description: `User deleted: ${user.name}`,
      metadata: { deletedAt: new Date() }
    }).save();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// PATCH /api/users/:id/password - Change user password
router.patch('/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash new password
    const saltRounds = config.security.bcryptSaltRounds;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    await user.save();
    
    // Log activity
    await new Activity({
      user: user._id,
      type: 'password_changed',
      description: `Password changed for user: ${user.name}`,
      metadata: { changedAt: new Date() }
    }).save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// POST /api/auth/logout - Logout user
router.post('/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Decode token to get user info for activity logging
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Log logout activity
        await Activity.create({
          type: 'user_logout',
          description: `User ${decoded.email} logged out`,
          user: decoded.userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (jwtError) {
        console.log('JWT verification failed during logout:', jwtError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

export default router;
