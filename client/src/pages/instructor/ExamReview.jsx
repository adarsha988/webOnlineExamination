import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, User, Mail, Calendar, FileText, Send, ArrowLeft } from 'lucide-react';
import { instructorExamReviewAPI } from '@/api/instructorExamReview';

const ExamReview = () => {
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState({});
  const [feedback, setFeedback] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchExamSubmissions();
  }, [examId]);

  const fetchExamSubmissions = async () => {
    try {
      setLoading(true);
      const data = await instructorExamReviewAPI.getExamSubmissions(examId);
      setExam(data.data.exam);
      setSubmissions(data.data.submissions);
      if (data.data.submissions.length > 0) {
        setSelectedSubmission(data.data.submissions[0]);
        initializeGrading(data.data.submissions[0]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Error loading exam submissions');
    } finally {
      setLoading(false);
    }
  };

  const initializeGrading = (submission) => {
    const initialGrading = {};
    submission.answers.forEach((answer, index) => {
      initialGrading[index] = {
        score: answer.score || 0,
        feedback: answer.feedback || ''
      };
    });
    setGrading(initialGrading);
  };

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    initializeGrading(submission);
    setFeedback(submission.feedback || '');
  };

  const handleScoreChange = (questionIndex, score) => {
    const maxScore = exam.questions[questionIndex].marks;
    const validScore = Math.max(0, Math.min(score, maxScore));
    setGrading(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        score: validScore
      }
    }));
  };

  const handleQuestionFeedback = (questionIndex, feedback) => {
    setGrading(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        feedback
      }
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(grading).reduce((total, grade) => total + (grade.score || 0), 0);
  };

  const calculatePercentage = () => {
    const totalScore = calculateTotalScore();
    const maxScore = exam.questions.reduce((total, q) => total + q.marks, 0);
    return Math.round((totalScore / maxScore) * 100);
  };

  const approveAndSendResult = async (sendEmail = false) => {
    try {
      setApproving(true);
      const totalScore = calculateTotalScore();
      const percentage = calculatePercentage();
      
      await instructorExamReviewAPI.approveExamResult({
        submissionId: selectedSubmission._id,
        totalScore,
        percentage,
        feedback,
        sendEmail,
        questionGrades: grading
      });

      toast.success(sendEmail ? 'Result approved and email sent!' : 'Result approved successfully!');
      fetchExamSubmissions();
    } catch (error) {
      console.error('Error approving result:', error);
      toast.error('Error approving result');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exam || submissions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Found</h3>
            <p className="text-gray-500">There are no student submissions for this exam yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Review</h1>
        <p className="text-gray-600">{exam.title} - {exam.subject}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submissions.map((submission) => (
                <motion.div
                  key={submission._id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSubmission?._id === submission._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSubmissionSelect(submission)}
                >
                  <div className="font-medium text-sm">{submission.studentId.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {submission.studentId.email}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <Badge variant={submission.isApproved ? 'success' : 'secondary'}>
                      {submission.isApproved ? 'Approved' : 'Pending Review'}
                    </Badge>
                  </div>
                  {submission.score !== null && (
                    <div className="text-xs text-gray-600 mt-1">
                      Score: {submission.score}/{exam.totalMarks} ({submission.percentage}%)
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-3">
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Student Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Review: {selectedSubmission.studentId.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Score: {calculateTotalScore()}/{exam.questions.reduce((total, q) => total + q.marks, 0)}
                      </Badge>
                      <Badge variant="outline">
                        {calculatePercentage()}%
                      </Badge>
                      <Badge variant={calculatePercentage() >= (exam.passingMarks || 60) ? 'success' : 'destructive'}>
                        {calculatePercentage() >= (exam.passingMarks || 60) ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Questions Review */}
              {exam.questions.map((question, index) => {
                const studentAnswer = selectedSubmission.answers[index];
                const currentGrading = grading[index] || { score: 0, feedback: '' };
                
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Question {index + 1} ({question.marks} marks)
                      </CardTitle>
                      <p className="text-gray-600">{question.text}</p>
                      {question.type === 'multiple_choice' && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-600">
                            Correct Answer: {question.options[question.correctAnswer]}
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Student Answer */}
                      <div>
                        <h4 className="font-medium mb-2">Student Answer:</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {question.type === 'multiple_choice' ? (
                            <div className="flex items-center gap-2">
                              <span>{studentAnswer?.answer || 'No answer provided'}</span>
                              {studentAnswer?.answer === question.options[question.correctAnswer] ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{studentAnswer?.answer || 'No answer provided'}</p>
                          )}
                        </div>
                      </div>

                      {/* Grading Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Score (0 - {question.marks})
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={question.marks}
                            value={currentGrading.score}
                            onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Question Feedback
                          </label>
                          <Textarea
                            value={currentGrading.feedback}
                            onChange={(e) => handleQuestionFeedback(index, e.target.value)}
                            placeholder="Optional feedback for this question..."
                            className="w-full"
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Overall Feedback and Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Feedback & Approval</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Overall Exam Feedback
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide overall feedback for the student's performance..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => approveAndSendResult(false)}
                      className="flex items-center gap-2"
                      disabled={approving || selectedSubmission.isApproved}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {approving ? 'Approving...' : 'Approve Result'}
                    </Button>
                    <Button
                      onClick={() => approveAndSendResult(true)}
                      variant="default"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      disabled={approving || selectedSubmission.isApproved}
                    >
                      <Send className="h-4 w-4" />
                      {approving ? 'Sending...' : 'Approve & Email Student'}
                    </Button>
                  </div>

                  {selectedSubmission.isApproved && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Result Already Approved</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        This exam has been graded and approved on {new Date(selectedSubmission.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamReview;
