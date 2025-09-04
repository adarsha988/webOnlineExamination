import express from 'express';
const router = express.Router();
import College from '../models/college.model.js';

// GET /api/college - Fetch all colleges
router.get('/', async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ name: 1 });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching colleges', error: error.message });
  }
});

// POST /api/college - Add new college
router.post('/', async (req, res) => {
  try {
    const { name, address, coordinates, phone, email, website, description } = req.body;
    
    if (!name || !address || !coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({ 
        message: 'Name, address, and coordinates (latitude, longitude) are required' 
      });
    }

    const newCollege = new College({
      name,
      address,
      coordinates,
      phone,
      email,
      website,
      description
    });

    const savedCollege = await newCollege.save();
    res.status(201).json(savedCollege);
  } catch (error) {
    res.status(500).json({ message: 'Error creating college', error: error.message });
  }
});

// GET /api/college/:id - Get specific college
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching college', error: error.message });
  }
});

export default router;
