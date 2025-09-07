import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AnalyticsCards = ({ analytics, className = '' }) => {
  const cards = [
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Best Score',
      value: `${analytics.bestScore}%`,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500'
    },
    {
      title: 'Pass Rate',
      value: `${analytics.passRate}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Exams Taken',
      value: analytics.examsAttempted,
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-500'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${card.bgColor} border-0 hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AnalyticsCards;
