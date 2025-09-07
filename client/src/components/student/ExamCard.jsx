import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, Play, Eye, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ExamCard = ({ exam, onStart, onViewResult, type = 'upcoming' }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderUpcomingExam = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{exam.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <BookOpen className="h-4 w-4" />
                {exam.subject}
              </CardDescription>
            </div>
            <Badge variant={exam.canStart ? "default" : "secondary"}>
              {exam.studentStatus === 'not_started' ? 'Available' : exam.studentStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {formatDate(exam.scheduledDate)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {formatDuration(exam.duration)} duration
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{exam.questions?.length || 0}</span> questions
            </div>
            {exam.canStart && (
              <Button 
                onClick={() => onStart(exam._id)}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Exam
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCompletedExam = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{exam.examId?.title || exam.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <BookOpen className="h-4 w-4" />
                {exam.examId?.subject || exam.subject}
              </CardDescription>
            </div>
            {exam.grade && (
              <Badge className={getGradeColor(exam.grade)}>
                {exam.grade}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Score:</span>
              <span className="font-semibold text-lg">
                {exam.score || 0}/{exam.examId?.totalMarks || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Percentage:</span>
              <span className="font-semibold text-lg text-blue-600">
                {exam.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Completed: {formatDate(exam.submittedAt)}
            </div>
            {exam.feedback && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Feedback:</span>
                <p className="text-gray-600 mt-1">{exam.feedback}</p>
              </div>
            )}
            <Button 
              onClick={() => onViewResult(exam.examId?._id || exam._id)}
              variant="outline"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return type === 'upcoming' ? renderUpcomingExam() : renderCompletedExam();
};

export default ExamCard;
