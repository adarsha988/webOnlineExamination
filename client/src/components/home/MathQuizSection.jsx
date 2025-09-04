import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Calculator, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';

const MathQuizSection = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch quiz questions from API
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/quiz');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        // Fallback to sample questions if API fails
        setQuestions(sampleQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions(sampleQuestions);
    } finally {
      setLoading(false);
    }
  };

  // Sample questions as fallback
  const sampleQuestions = [
    {
      _id: '1',
      question: 'What is 15 + 27?',
      options: ['40', '42', '44', '46'],
      correctAnswer: 1
    },
    {
      _id: '2',
      question: 'Solve: 8 × 9 = ?',
      options: ['64', '72', '81', '90'],
      correctAnswer: 1
    },
    {
      _id: '3',
      question: 'What is the square root of 144?',
      options: ['10', '11', '12', '13'],
      correctAnswer: 2
    },
    {
      _id: '4',
      question: 'If x + 5 = 12, what is x?',
      options: ['5', '6', '7', '8'],
      correctAnswer: 2
    },
    {
      _id: '5',
      question: 'What is 25% of 80?',
      options: ['15', '20', '25', '30'],
      correctAnswer: 1
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Update user answers
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: answerIndex
    }));

    // Update score if correct
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[questions[currentQuestionIndex - 1]._id] || null);
      setShowFeedback(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers({});
    setShowFeedback(false);
    setQuizCompleted(false);
    setScore(0);
  };

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz questions...</p>
          </div>
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Quiz Questions Available</h2>
            <p className="text-gray-600">Please check back later for math quiz questions.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">Mathematics Quiz</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test your mathematical skills with our interactive quiz. Get real-time feedback on your answers!
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {!quizCompleted ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
            >
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    Score: {score}/{questions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                  {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => {
                    let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 font-medium text-lg";
                    
                    if (showFeedback) {
                      if (index === currentQuestion.correctAnswer) {
                        buttonClass += " bg-green-100 border-green-500 text-green-800";
                      } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                        buttonClass += " bg-red-100 border-red-500 text-red-800";
                      } else {
                        buttonClass += " bg-gray-100 border-gray-300 text-gray-600";
                      }
                    } else {
                      if (selectedAnswer === index) {
                        buttonClass += " bg-blue-100 border-blue-500 text-blue-800";
                      } else {
                        buttonClass += " bg-gray-50 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300";
                      }
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: showFeedback ? 1 : 1.02 }}
                        whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                        onClick={() => handleAnswerSelect(index)}
                        className={buttonClass}
                        disabled={showFeedback}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showFeedback && index === currentQuestion.correctAnswer && (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                          {showFeedback && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-xl mb-6 ${
                      isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 mr-3" />
                      )}
                      <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct! Well done!' : `Incorrect. The correct answer is: ${currentQuestion.options[currentQuestion.correctAnswer]}`}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={!showFeedback}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* Quiz Completed */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h3>
              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
                  {score}/{questions.length}
                </div>
                <div className={`text-2xl font-semibold ${getScoreColor()}`}>
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>
              <p className="text-xl text-gray-600 mb-8">
                {score === questions.length ? 'Perfect score! Excellent work!' :
                 score >= questions.length * 0.8 ? 'Great job! You did very well!' :
                 score >= questions.length * 0.6 ? 'Good effort! Keep practicing!' :
                 'Keep studying and try again!'}
              </p>
              <button
                onClick={resetQuiz}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium text-lg transition-colors hover:bg-blue-700"
              >
                Take Quiz Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MathQuizSection;
