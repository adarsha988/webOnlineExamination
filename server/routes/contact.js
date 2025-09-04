import express from 'express';
const router = express.Router();
import Contact from '../models/contact.model.js';

// POST /api/contact - Save contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Name, email, and message are required' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    const newContact = new Contact({
      name,
      email,
      message
    });

    const savedContact = await newContact.save();
    res.status(201).json({ 
      message: 'Contact message saved successfully',
      id: savedContact._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving contact message', error: error.message });
  }
});

// GET /api/contact - Fetch all contact messages (admin only)
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact messages', error: error.message });
  }
});

export default router;
