  import React, { useState } from 'react';
  import { motion } from 'motion/react';
  import { BottomNav } from '../components/common/BottomNav';
  import { Recycle, Bike, TreePine, Droplet, Sun, Wind, CheckCircle2, Camera, Users, MapPin } from 'lucide-react';
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
    type?: 'standard' | 'photo';
    location?: string;
    author?: string;
    completions?: number;
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
        type: 'standard',
      },
      // Photo Challenges
      {
        id: 7,
        title: 'Očisti park Kalemegdan',
        description: 'Fotografiši smeće u parku i pokušaj da ga pokupljaš',
        progress: 0,
        total: 1,
        points: 150,
        icon: Camera,
        status: 'available',
        gradient: 'from-purple-500 to-pink-600',
        type: 'photo',
        location: 'Kalemegdan, Beograd',
        author: 'Ana Petrović',
        completions: 12,
      },
      {
        id: 8,
        title: 'Razdvojeno bacanje otpada',
        description: 'Fotografiši pravilno razvrstan otpad u kontejnerima',
        progress: 1,
        total: 1,
        points: 100,
        icon: Camera,
        status: 'completed',
        gradient: 'from-blue-500 to-purple-600',
        type: 'photo',
        location: 'Novi Beograd',
        author: 'Stefan Ilić',
        completions: 8,
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
          Dnevni Izazovi <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} viewBox="0 0 24 24"><path fill="#2bc154" d="M7 21v-2h4v-3.1q-1.225-.275-2.187-1.037T7.4 12.95q-1.875-.225-3.137-1.637T3 8V7q0-.825.588-1.412T5 5h2V3h10v2h2q.825 0 1.413.588T21 7v1q0 1.9-1.263 3.313T16.6 12.95q-.45 1.15-1.412 1.913T13 15.9V19h4v2zm0-10.2V7H5v1q0 .95.55 1.713T7 10.8m10 0q.9-.325 1.45-1.088T19 8V7h-2z"></path></svg>
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
                      {/* Photo Challenge Info */}
                      {challenge.type === 'photo' && (
                        <div className="photo-challenge-meta">
                          {challenge.location && (
                            <div className="photo-challenge-location">
                              <MapPin className="w-3 h-3" />
                              <span>{challenge.location}</span>
                            </div>
                          )}
                          {challenge.author && (
                            <div className="photo-challenge-author">
                              Kreirao: {challenge.author}
                            </div>
                          )}
                          {challenge.completions && (
                            <div className="photo-challenge-completions">
                              <Users className="w-3 h-3" />
                              <span>{challenge.completions} završenih</span>
                            </div>
                          )}
                        </div>
                      )}
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
