import express from 'express';
const router = express.Router();
import Testimonial from '../models/testimonial.model.js';

// GET /api/testimonial - Fetch all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
});

// POST /api/testimonial - Add new testimonial
router.post('/', async (req, res) => {
  try {
    const { name, designation, company, profileImage, message } = req.body;
    
    if (!name || !designation || !company || !message) {
      return res.status(400).json({ 
        message: 'Name, designation, company, and message are required' 
      });
    }

    const newTestimonial = new Testimonial({
      name,
      designation,
      company,
      profileImage,
      message
    });

    const savedTestimonial = await newTestimonial.save();
    res.status(201).json(savedTestimonial);
  } catch (error) {
    res.status(500).json({ message: 'Error creating testimonial', error: error.message });
  }
});

export default router;
