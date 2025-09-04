import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true } // index of correct option
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
