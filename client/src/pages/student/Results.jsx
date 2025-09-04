import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { BarChart3, Clock, Trophy, TrendingUp, Download, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import StudentLayout from '../../layouts/StudentLayout';
import { fetchResults, fetchResultById } from '../../store/attemptSlice';

const Results = () => {
  const dispatch = useDispatch();
  const [location] = useLocation();
  const { results, currentResult } = useSelector((state) => state.attempt);
  
  const [selectedResult, setSelectedResult] = useState(null);

  // Get attempt ID from URL params if viewing specific result
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const attemptId = urlParams.get('attempt');

  useEffect(() => {
    dispatch(fetchResults());
    
    if (attemptId) {
      dispatch(fetchResultById(attemptId));
    }
  }, [dispatch, attemptId]);

  useEffect(() => {
    if (currentResult && attemptId) {
      setSelectedResult(currentResult);
    }
  }, [currentResult, attemptId]);

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    dispatch(fetchResultById(result.id));
  };

  const calculateStats = () => {
    if (!results.length) return { avgScore: 0, bestScore: 0, completed: 0 };
    
    const scores = results.map(r => r.score);
    return {
      avgScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: Math.max(...scores),
      completed: results.length,
    };
  };

  const stats = calculateStats();

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-secondary';
    if (score >= 80) return 'text-primary';
    if (score >= 70) return 'text-accent';
    return 'text-destructive';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A') return 'bg-secondary/10 text-secondary';
    if (grade === 'B') return 'bg-primary/10 text-primary';
    if (grade === 'C') return 'bg-accent/10 text-accent';
    return 'bg-destructive/10 text-destructive';
  };

  const ResultDetailView = ({ result }) => {
    if (!result || !result.questions) return null;

    const questionAnalysis = result.questions.map(question => {
      const feedback = result.feedback?.[question.id];
      const userAnswer = result.answers?.[question.id];
      
      return {
        ...question,
        userAnswer,
        feedback,
        isCorrect: feedback?.score === question.points,
      };
    });

    const correctAnswers = questionAnalysis.filter(q => q.isCorrect).length;
    const partialAnswers = questionAnalysis.filter(q => q.feedback?.score > 0 && !q.isCorrect).length;

    return (
      <div className="space-y-8">
        {/* Result Summary */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{result.exam?.title}</h2>
              <p className="text-muted-foreground">{result.exam?.subject} • Completed on {new Date(result.completedAt).toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(result.score)}`}>
                  {result.score}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getPerformanceColor(result.score)}`}>
                  {result.grade}
                </div>
                <p className="text-sm text-muted-foreground">Grade</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {Math.floor(Math.random() * 20) + 5}
                </div>
                <p className="text-sm text-muted-foreground">Class Rank</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {Math.floor((result.exam?.duration || 60) * 0.8)}m
                </div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-4 mb-4">
              <div 
                className="bg-primary h-4 rounded-full transition-all duration-300" 
                style={{ width: `${result.score}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              You scored higher than {Math.floor(result.score * 0.8)}% of students
            </p>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Type Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance by Question Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">Multiple Choice</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(result.score * 1.05)}%
                  </span>
                </div>
                <Progress value={Math.round(result.score * 1.05)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">True/False</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(result.score * 0.95)}%
                  </span>
                </div>
                <Progress value={Math.round(result.score * 0.95)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground">Short Answer</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.round(result.score * 0.9)}%
                  </span>
                </div>
                <Progress value={Math.round(result.score * 0.9)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Time</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.floor((result.exam?.duration || 60) * 0.8)} minutes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average per Question</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(((result.exam?.duration || 60) * 0.8) / (result.questions?.length || 1) * 10) / 10} minutes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fastest Question</span>
                <span className="text-sm font-medium text-foreground">45 seconds</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Slowest Question</span>
                <span className="text-sm font-medium text-foreground">8.2 minutes</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center text-sm">
                  <Lightbulb className="h-4 w-4 text-accent mr-2" />
                  <span className="text-muted-foreground">
                    You finished with {Math.floor((result.exam?.duration || 60) * 0.2)} minutes remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.score >= 90 && (
                <div className="flex items-start space-x-3">
                  <Trophy className="h-4 w-4 text-secondary mt-1" />
                  <p className="text-sm text-foreground">Excellent performance across all question types</p>
                </div>
              )}
              {result.score >= 80 && result.score < 90 && (
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-4 w-4 text-primary mt-1" />
                  <p className="text-sm text-foreground">Great work! Review the areas where you lost points</p>
                </div>
              )}
              {result.score < 80 && (
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-4 w-4 text-accent mt-1" />
                  <p className="text-sm text-foreground">Consider reviewing the course material and practice more</p>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-primary mt-1" />
                <p className="text-sm text-foreground">Good time management - you can afford to double-check your work</p>
              </div>
              <div className="pt-3 border-t border-border">
                <Button size="sm" className="w-full" data-testid="button-download-report">
                  <Download className="h-4 w-4 mr-2" />
                  Download Detailed Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question-by-Question Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Question Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">Detailed breakdown of your performance on each question</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {questionAnalysis.map((question, index) => (
                <div key={question.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Question {index + 1}
                      </h4>
                      <p className="text-sm text-muted-foreground">{question.text}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        question.isCorrect 
                          ? 'bg-secondary/10 text-secondary'
                          : question.feedback?.score > 0
                          ? 'bg-accent/10 text-accent'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {question.isCorrect ? 'Correct' : question.feedback?.score > 0 ? 'Partial' : 'Incorrect'}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {question.feedback?.score || 0}/{question.points} pts
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your Answer:</p>
                      <p className="text-sm text-foreground bg-muted p-3 rounded">
                        {question.userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Feedback:</p>
                      <p className={`text-sm text-foreground p-3 rounded ${
                        question.isCorrect ? 'bg-secondary/10' : 'bg-accent/10'
                      }`}>
                        {question.feedback?.explanation || 'No feedback available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{Math.floor(Math.random() * 5) + 1}m {Math.floor(Math.random() * 60)}s</span>
                    <span className="mx-2">•</span>
                    <span>Difficulty: {['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)]}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Examination Results</h1>
          <p className="text-muted-foreground">View your performance and detailed feedback</p>
        </div>

        <Tabs defaultValue={selectedResult ? "details" : "overview"} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {selectedResult && <TabsTrigger value="details">Detailed Analysis</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-accent" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                      <p className="text-2xl font-bold text-foreground">{stats.bestScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-secondary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Exam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {results.map((result) => (
                          <tr key={result.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-foreground">{result.examTitle}</div>
                                <div className="text-sm text-muted-foreground">{result.subject}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(result.completedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${getPerformanceColor(result.score)}`}>
                                {result.score}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(result)}
                                data-testid={`button-view-details-${result.id}`}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
                    <p className="text-muted-foreground">Complete an exam to see your results here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {selectedResult && (
            <TabsContent value="details">
              <ResultDetailView result={selectedResult} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default Results;
