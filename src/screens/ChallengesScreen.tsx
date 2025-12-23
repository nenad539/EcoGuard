import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase-client';
import { BottomNav } from '../components/common/BottomNav';
import {
  Recycle,
  Bike,
  TreePine,
  Droplet,
  Sun,
  CheckCircle2
} from 'lucide-react';
import '../styles/ChallengesScreen.css';

/* ============================
   TYPES
============================ */

type ChallengeStatus = 'active' | 'completed' | 'available';

type DailyChallenge = {
  id: number;
  title: string;
  description: string | null;
  points: number;
};

type ChallengeTemplate = {
  icon: React.ElementType;
  gradient: string;
};

type ChallengeCompletion = {
  challenge_id: number;
  completed_at: string;
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

// Supabase table for storing daily challenge completions
// Table names to try for completion storage (env override first)
const COMPLETION_TABLE_CANDIDATES = [
  import.meta.env.VITE_DAILY_COMPLETION_TABLE,
  'daily_challenge_completion',
  'dailyChallengeCompletion',
  'user_daily_challenges'
].filter(Boolean) as string[];

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    icon: Recycle,
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    icon: Bike,
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    icon: TreePine,
    gradient: 'from-green-600 to-lime-600'
  },
  {
    icon: Droplet,
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Sun,
    gradient: 'from-yellow-500 to-orange-600'
  }
];

export function ChallengesScreen() {
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [completionMap, setCompletionMap] = useState<Record<number, ChallengeCompletion>>({});
  const [dailyPointsEarned, setDailyPointsEarned] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completionTable, setCompletionTable] = useState<string | null>(null);
  const resolvingTable = useRef<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [completionsLoading, setCompletionsLoading] = useState<boolean>(false);
  const [completionLoadingId, setCompletionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError('Greška prilikom učitavanja izazova.');
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

  useEffect(() => {
    let mounted = true;

    const fetchUserId = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.warn('auth.getUser error (challenges):', authError.message || authError);
        }
        const currentUserId = authData?.user?.id;
        if (mounted && currentUserId) {
          setUserId(currentUserId);
          return;
        }
      } catch (e) {
        console.warn('auth.getUser threw (challenges):', e);
      }

      try {
        const { data: idData, error: idError } = await supabase
          .from('korisnik_profil')
          .select('id')
          .limit(1);
        if (idError) {
          console.error('Error fetching fallback user id (challenges):', idError);
          return;
        }
        if (mounted && idData?.[0]?.id) {
          setUserId(idData[0].id);
        }
      } catch (e) {
        console.error('Unexpected error fetching fallback id (challenges):', e);
      }
    };

    fetchUserId();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || dailyChallenges.length === 0) return;
    let mounted = true;

    const fetchCompletions = async () => {
      let tableToUse = completionTable;

      // Resolve completion table once
      if (!tableToUse && !resolvingTable.current) {
        resolvingTable.current = true;
        for (const candidate of COMPLETION_TABLE_CANDIDATES) {
          const { error } = await supabase
            .from(candidate)
            .select('challenge_id')
            .limit(1);

          if (error?.code === 'PGRST205') {
            continue; // table not found, try next
          }

          if (!error) {
            tableToUse = candidate;
            setCompletionTable(candidate);
            break;
          }

          // For other errors (e.g., RLS), assume table exists and break
          tableToUse = candidate;
          setCompletionTable(candidate);
          break;
        }
        resolvingTable.current = false;
      }

      if (!tableToUse) {
        setError('Nije pronađena tabela za završene izazove. Provjerite naziv u Supabase-u.');
        return;
      }

      setCompletionsLoading(true);
      setError(null);
      const challengeIds = dailyChallenges.map(challenge => challenge.id);

      const { data, error } = await supabase
        .from(tableToUse)
        .select('challenge_id, completed_at')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      if (!mounted) return;

      if (error) {
        console.error('Error fetching challenge completions:', error);
        setError('Ne možemo učitati završene izazove.');
        setCompletionMap({});
      } else if (data) {
        const mapped = data.reduce<Record<number, ChallengeCompletion>>((acc, item) => {
          acc[item.challenge_id] = item;
          return acc;
        }, {});
        setCompletionMap(mapped);
      }
      setCompletionsLoading(false);
    };

    fetchCompletions();
    return () => {
      mounted = false;
    };
  }, [userId, dailyChallenges]);

  const firstIncompleteId = dailyChallenges.find(challenge => !completionMap[challenge.id])?.id;

  const challengeCards = dailyChallenges.map((challenge, index) => {
    const template = CHALLENGE_TEMPLATES[index % CHALLENGE_TEMPLATES.length];
    const isCompleted = Boolean(completionMap[challenge.id]);
    const status: ChallengeStatus = isCompleted
      ? 'completed'
      : challenge.id === firstIncompleteId
        ? 'active'
        : 'available';

    return {
      ...template,
      status,
      progress: isCompleted ? 1 : 0,
      total: 1,
      challenge
    };
  });

  const awardPoints = async (points: number) => {
    if (!userId) return;
    // Prefer stored procedure if present; otherwise attempt direct increment
    const { error: rpcError } = await supabase.rpc('add_points', {
      uid: userId,
      pts: points
    });

    if (!rpcError) return;
    console.warn('add_points RPC failed, attempting direct update:', rpcError);

    // Fallback: increment ukupno_poena directly
    // Fetch current points then update to avoid silent failure
    const { data: profile, error: fetchError } = await supabase
      .from('korisnik_profil')
      .select('ukupno_poena')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to read points for fallback update:', fetchError);
      return;
    }

    const currentPoints = profile?.ukupno_poena ?? 0;
    const { error: updateError } = await supabase
      .from('korisnik_profil')
      .update({ ukupno_poena: currentPoints + points })
      .eq('id', userId);

    if (updateError) {
      console.error('Fallback points update failed:', updateError);
    }
  };

  const handleCompleteChallenge = async (challengeId: number, points: number) => {
    if (!userId) {
      setError('Morate biti prijavljeni da biste završili izazov.');
      return;
    }

    if (!completionTable) {
      setError('Nije pronađena tabela za završene izazove.');
      return;
    }

    setCompletionLoadingId(challengeId);
    setError(null);

    const payload = {
      user_id: userId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from(completionTable)
      .upsert(payload, { onConflict: 'user_id,challenge_id' });

    if (error) {
      console.error('Error saving challenge completion:', error);
      setError('Greška prilikom čuvanja završetka izazova.');
    } else {
      setCompletionMap(prev => ({
        ...prev,
        [challengeId]: {
          challenge_id: challengeId,
          completed_at: payload.completed_at
        }
      }));
      await awardPoints(points);
    }

    setCompletionLoadingId(null);
  };

  const activeCount = challengeCards.filter(c => c.status === 'active').length;
  const completedCount = challengeCards.filter(c => c.status === 'completed').length;

  // Compute today's earned points from completion timestamps
  useEffect(() => {
    const today = new Date();
    const isSameDay = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    const pointsById = dailyChallenges.reduce<Record<number, number>>((acc, challenge) => {
      acc[challenge.id] = challenge.points;
      return acc;
    }, {});

    const total = Object.values(completionMap).reduce((sum, completion) => {
      if (!isSameDay(completion.completed_at)) return sum;
      const pts = pointsById[completion.challenge_id] ?? 0;
      return sum + pts;
    }, 0);

    setDailyPointsEarned(total);
  }, [completionMap, dailyChallenges]);


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
        {error && <div className="fetch-error">{error}</div>}

        {!loading &&
          challengeCards.map((card, index) => {
            const { challenge } = card;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`challenge-card ${
                  card.status === 'completed' ? 'challenge-card-completed' : ''
                }`}
              >
                <div className="challenge-content">
                  <div
                    className={`challenge-icon ${card.gradient
                      .replace('from-', 'gradient-from-')
                      .replace(' to-', '-gradient-to-')}`}
                  >
                    <card.icon className="challenge-icon-svg" />
                  </div>

                  <div className="challenge-details">
                    <div className="challenge-header">
                      <h3 className="challenge-title">
                        {challenge.title}
                      </h3>
                      {card.status === 'completed' && (
                        <CheckCircle2 className="challenge-completed-icon" />
                      )}
                    </div>

                    <p className="challenge-description">
                      {challenge.description}
                    </p>

                    <div className="challenge-progress">
                      <div className="challenge-progress-info">
                        <span className="challenge-progress-text">
                          Napredak: {card.progress}/{card.total}
                        </span>
                        <span className="challenge-points">
                          +{challenge.points} poena
                        </span>
                      </div>
                      <div className="challenge-progress-bar">
                        <div
                          className="challenge-progress-fill"
                          style={{
                            width: `${(card.progress / card.total) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="challenge-actions">
                      {card.status === 'completed' ? (
                        <div className="challenge-completed-status">
                          <CheckCircle2 className="challenge-completed-check" />
                          Završeno
                        </div>
                      ) : (
                        <button
                          className={`challenge-button ${card.status}`}
                          onClick={() => handleCompleteChallenge(challenge.id, challenge.points)}
                          disabled={completionLoadingId === challenge.id || completionsLoading}
                        >
                          {completionLoadingId === challenge.id
                            ? 'Spremanje...'
                            : card.status === 'active'
                              ? 'Završi izazov'
                              : 'Započni'}
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
            <div className="challenges-stat">
              <div className="challenges-stat-number">
                {dailyPointsEarned}
              </div>
              <div className="challenges-stat-label">
                Poena (danas)
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
