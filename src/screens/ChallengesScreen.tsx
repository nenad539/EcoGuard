import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/common/BottomNav';
import { Recycle, Bike, TreePine, Droplet, Sun, Wind, CheckCircle2 } from 'lucide-react';
import '../styles/ChallengesScreen.css';

type Challenge = {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  points: number;
  icon: React.ElementType;
  status: 'active' | 'completed' | 'available';
  gradient: string;
};

export function ChallengesScreen() {
  const [challenges] = useState<Challenge[]>([
    {
      id: 1,
      title: 'Recikliraj 10 flaša',
      description: 'Sakupi i recikliraj 10 plastičnih flaša',
      progress: 7,
      total: 10,
      points: 100,
      icon: Recycle,
      status: 'active',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      id: 2,
      title: 'Koristi bicikl 3 dana zaredom',
      description: 'Vozi bicikl umjesto automobila',
      progress: 2,
      total: 3,
      points: 150,
      icon: Bike,
      status: 'active',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      id: 3,
      title: 'Posadi drvo',
      description: 'Posadi jedno drvo u svom okruženju',
      progress: 1,
      total: 1,
      points: 200,
      icon: TreePine,
      status: 'completed',
      gradient: 'from-green-600 to-lime-600',
    },
    {
      id: 4,
      title: 'Smanji potrošnju vode',
      description: 'Uštedi 50L vode ove sedmice',
      progress: 32,
      total: 50,
      points: 120,
      icon: Droplet,
      status: 'active',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      id: 5,
      title: 'Koristi solarnu energiju',
      description: 'Probaj jedan dan bez struje iz mreže',
      progress: 0,
      total: 1,
      points: 300,
      icon: Sun,
      status: 'available',
      gradient: 'from-yellow-500 to-orange-600',
    },
    {
      id: 6,
      title: 'Ekološki transport',
      description: 'Hodaj ili koristi javni prevoz cijelu sedmicu',
      progress: 4,
      total: 7,
      points: 180,
      icon: Wind,
      status: 'active',
      gradient: 'from-teal-500 to-green-600',
    },
  ]);

  const activeCount = challenges.filter((c) => c.status === 'active').length;
  const completedCount = challenges.filter((c) => c.status === 'completed').length;

  return (
    <div className="challenges-screen">
      {/* Header */}
      <div className="challenges-header">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="challenges-title"
        >
          Izazovi 🏆
        </motion.h1>
        <p className="challenges-subtitle">
          {activeCount} aktivnih • {completedCount} završenih
        </p>
      </div>

      {/* Challenges List */}
      <div className="challenges-list">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`challenge-card ${
              challenge.status === 'completed'
                ? 'challenge-card-completed'
                : ''
            }`}
          >
            <div className="challenge-content">
              {/* Icon */}
              <div className={`challenge-icon ${challenge.gradient.replace('from-', 'gradient-from-').replace(' to-', '-gradient-to-')}`}>
                <challenge.icon className="challenge-icon-svg" />
              </div>

              {/* Content */}
              <div className="challenge-details">
                <div className="challenge-header">
                  <div className="challenge-info">
                    <h3 className="challenge-title">{challenge.title}</h3>
                    <p className="challenge-description">
                      {challenge.description}
                    </p>
                  </div>
                  {challenge.status === 'completed' && (
                    <CheckCircle2 className="challenge-completed-icon" />
                  )}
                </div>

                {/* Progress */}
                {challenge.status !== 'available' && (
                  <div className="challenge-progress">
                    <div className="challenge-progress-info">
                      <span className="challenge-progress-text">
                        Napredak: {challenge.progress}/{challenge.total}
                      </span>
                      <span className="challenge-points">+{challenge.points} poena</span>
                    </div>
                    <div className="challenge-progress-bar">
                      <div 
                        className="challenge-progress-fill"
                        style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="challenge-actions">
                  {challenge.status === 'completed' ? (
                    <div className="challenge-completed-status">
                      <CheckCircle2 className="challenge-completed-check" />
                      Završeno ✅
                    </div>
                  ) : challenge.status === 'active' ? (
                    <button className="challenge-button active">
                      Nastavi
                    </button>
                  ) : (
                    <button className="challenge-button available">
                      Započni
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="challenges-summary-wrapper">
        <div className="challenges-summary-card">
          <h3 className="challenges-summary-title">Tvoja statistika izazova</h3>
          <div className="challenges-stats">
            <div className="challenges-stat">
              <div className="challenges-stat-number">{activeCount}</div>
              <div className="challenges-stat-label">Aktivnih</div>
            </div>
            <div className="challenges-stat">
              <div className="challenges-stat-number">{completedCount}</div>
              <div className="challenges-stat-label">Završenih</div>
            </div>
            <div className="challenges-stat">
              <div className="challenges-stat-number">{challenges.length}</div>
              <div className="challenges-stat-label">Ukupno</div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
