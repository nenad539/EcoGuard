import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase-client';
import { BottomNav } from '../components/common/BottomNav';
import {
  Recycle,
  Bike,
  TreePine,
  Droplet,
  Sun,
  Wind,
  CheckCircle2
} from 'lucide-react';
import '../styles/ChallengesScreen.css';

/* ============================
   TYPES
============================ */

type DailyChallenge = {
  id: number;
  title: string;
  description: string | null;
  points: number;
};

type ChallengeUI = {
  icon: React.ElementType;
  gradient: string;
  status: 'active' | 'completed' | 'available';
  progress: number;
  total: number;
};

/* ============================
   ROTATION LOGIC (24H)
============================ */

function getDailyChallengeIds(): number[] {
  const TOTAL_CHALLENGES = 100;
  const CHALLENGES_PER_DAY = 5;
  const GROUP_COUNT = TOTAL_CHALLENGES / CHALLENGES_PER_DAY;
  const START_DATE = new Date('2025-10-10T00:00:00Z');
  const now = new Date();

  const daysSinceStart = Math.floor(
    (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  const groupIndex = daysSinceStart % GROUP_COUNT;
  const startId = groupIndex * CHALLENGES_PER_DAY + 1;

  return [
    startId,
    startId + 1,
    startId + 2,
    startId + 3,
    startId + 4
  ];
}

/* ============================
   COMPONENT
============================ */

export function ChallengesScreen() {
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
  const fetchDailyChallenges = async () => {
    const ids = getDailyChallengeIds();

   console.log('Fetching IDs:', ids);
const { data, error } = await supabase
  .from('dailyChallenge')
  .select('id, title, description, points')
  .in('id', ids)
  .order('id', { ascending: true });

console.log('Supabase data:', data);
console.log('Supabase error:', error);

    if (error) {
      console.error('Error fetching daily challenges:', error);
      setDailyChallenges([]);
    } else if (!data || data.length === 0) {
      console.warn('No challenges found for today. Check your IDs in DB!');
      setDailyChallenges([]);
    } else {
      setDailyChallenges(data);
    }

    setLoading(false);
  };

  fetchDailyChallenges();
}, []);

  const uiChallenges: ChallengeUI[] = [
    {
      icon: Recycle,
      gradient: 'from-green-500 to-emerald-600',
      status: 'active',
      progress: 0,
      total: 1
    },
    {
      icon: Bike,
      gradient: 'from-blue-500 to-cyan-600',
      status: 'available',
      progress: 0,
      total: 1
    },
    {
      icon: TreePine,
      gradient: 'from-green-600 to-lime-600',
      status: 'available',
      progress: 0,
      total: 1
    },
    {
      icon: Droplet,
      gradient: 'from-cyan-500 to-blue-600',
      status: 'available',
      progress: 0,
      total: 1
    },
    {
      icon: Sun,
      gradient: 'from-yellow-500 to-orange-600',
      status: 'available',
      progress: 0,
      total: 1
    }
  ];

  const activeCount = uiChallenges.filter(c => c.status === 'active').length;
  const completedCount = uiChallenges.filter(c => c.status === 'completed').length;

  return (
    <div className="challenges-screen">
      <div className="challenges-header">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="challenges-title"
        >
          Dnevni izazovi 🌱
        </motion.h1>
        <p className="challenges-subtitle">
          {activeCount} aktivnih • {completedCount} završenih
        </p>
      </div>

      <div className="challenges-list">
        {loading && <p>Učitavanje...</p>}

        {!loading &&
          dailyChallenges.map((challenge, index) => {
            const ui = uiChallenges[index];

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="challenge-card"
              >
                <div className="challenge-content">
                  <div
                    className={`challenge-icon ${ui.gradient
                      .replace('from-', 'gradient-from-')
                      .replace(' to-', '-gradient-to-')}`}
                  >
                    <ui.icon className="challenge-icon-svg" />
                  </div>

                  <div className="challenge-details">
                    <div className="challenge-header">
                      <h3 className="challenge-title">
                        {challenge.title}
                      </h3>
                      {ui.status === 'completed' && (
                        <CheckCircle2 className="challenge-completed-icon" />
                      )}
                    </div>

                    <p className="challenge-description">
                      {challenge.description}
                    </p>

                    <div className="challenge-progress">
                      <div className="challenge-progress-info">
                        <span className="challenge-progress-text">
                          Napredak: {ui.progress}/{ui.total}
                        </span>
                        <span className="challenge-points">
                          +{challenge.points} poena
                        </span>
                      </div>
                      <div className="challenge-progress-bar">
                        <div
                          className="challenge-progress-fill"
                          style={{
                            width: `${(ui.progress / ui.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="challenge-actions">
                      {ui.status === 'completed' ? (
                        <div className="challenge-completed-status">
                          <CheckCircle2 className="challenge-completed-check" />
                          Završeno
                        </div>
                      ) : (
                        <button className="challenge-button available">
                          Započni
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      <div className="challenges-summary-wrapper">
        <div className="challenges-summary-card">
          <h3 className="challenges-summary-title">
            Današnja statistika
          </h3>
          <div className="challenges-stats">
            <div className="challenges-stat">
              <div className="challenges-stat-number">
                {dailyChallenges.length}
              </div>
              <div className="challenges-stat-label">
                Izazova
              </div>
            </div>
            <div className="challenges-stat">
              <div className="challenges-stat-number">
                {dailyChallenges.reduce((sum, c) => sum + c.points, 0)}
              </div>
              <div className="challenges-stat-label">
                Poena
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
