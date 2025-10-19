import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/common/BottomNav';
import { Search, Trophy, Medal, Award } from 'lucide-react';
import '../styles/CommunityScreen.css';

type User = {
  id: number;
  name: string;
  points: number;
  level: number;
  avatar?: string;
  badge: 'bronze' | 'silver' | 'gold';
  rank: number;
};

export function CommunityScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const users: User[] = [
    {
      id: 1,
      name: 'Ana Petrović',
      points: 5240,
      level: 8,
      badge: 'gold',
      rank: 1,
    },
    {
      id: 2,
      name: 'Nikola Jovanović',
      points: 4890,
      level: 7,
      badge: 'gold',
      rank: 2,
    },
    {
      id: 3,
      name: 'Jelena Marković',
      points: 4320,
      level: 7,
      badge: 'gold',
      rank: 3,
    },
    {
      id: 4,
      name: 'Stefan Ilić',
      points: 3870,
      level: 6,
      badge: 'silver',
      rank: 4,
    },
    {
      id: 5,
      name: 'Milica Đorđević',
      points: 3540,
      level: 6,
      badge: 'silver',
      rank: 5,
    },
    {
      id: 6,
      name: 'Luka Nikolić',
      points: 3210,
      level: 5,
      badge: 'silver',
      rank: 6,
    },
    {
      id: 7,
      name: 'Tijana Stanković',
      points: 2890,
      level: 5,
      badge: 'silver',
      rank: 7,
    },
    {
      id: 8,
      name: 'Marko Pavlović',
      points: 2450,
      level: 3,
      badge: 'bronze',
      rank: 8,
    },
    {
      id: 9,
      name: 'Sara Simić',
      points: 2120,
      level: 4,
      badge: 'bronze',
      rank: 9,
    },
    {
      id: 10,
      name: 'David Kostić',
      points: 1980,
      level: 4,
      badge: 'bronze',
      rank: 10,
    },
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'gold':
        return 'yellow-500';
      case 'silver':
        return 'slate-400';
      case 'bronze':
        return 'amber-600';
      default:
        return 'slate-500';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="community-rank-icon-gold" />;
    if (rank === 2) return <Medal className="community-rank-icon-silver" />;
    if (rank === 3) return <Medal className="community-rank-icon-bronze" />;
    return null;
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="community-screen">
      {/* Header */}
      <div className="community-header">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="community-title"
        >
          Zajednica 👥
        </motion.h1>
        <p className="community-subtitle">Top 10 EcoGuarda</p>

        {/* Search Bar */}
        <div className="community-search">
          <Search className="community-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Pronađi korisnika…"
            className="community-search-input"
          />
        </div>

        {/* Filter Tabs */}
        <div className="community-filter-tabs">
          {['Svi', 'Bronzani', 'Srebrni', 'Zlatni'].map((filter, index) => (
            <button
              key={filter}
              className={`community-filter-tab ${index === 0 ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="community-leaderboard">
        <div className="community-podium">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="community-podium-item second"
          >
            <div className="community-podium-rank second">2</div>
            <div className="community-podium-avatar">
              NJ
            </div>
            <p className="community-podium-name">{users[1].name.split(' ')[0]}</p>
            <p className="community-podium-points">{users[1].points} pts</p>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="community-podium-item first"
          >
            <div className="community-podium-rank first">1</div>
            <div className="community-podium-avatar">
              AP
            </div>
            <p className="community-podium-name">{users[0].name.split(' ')[0]}</p>
            <p className="community-podium-points">{users[0].points} pts</p>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="community-podium-item third"
          >
            <div className="community-podium-rank third">3</div>
            <div className="community-podium-avatar">
              JM
            </div>
            <p className="community-podium-name">{users[2].name.split(' ')[0]}</p>
            <p className="community-podium-points">{users[2].points} pts</p>
          </motion.div>
        </div>

        {/* Leaderboard List */}
        <div className="community-user-list">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`community-user-item ${
              user.rank <= 3
                ? 'community-user-item-top'
                : ''
            }`}
          >
            <div className="community-user-content">
              {/* Rank */}
              <div className="community-user-rank">
                {getRankIcon(user.rank) || (
                  <span className="community-user-rank-number">{user.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`community-user-avatar ${getBadgeColor(user.badge).replace('bg-', '')}`}>
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>

              {/* Info */}
              <div className="community-user-info">
                <div className="community-user-info-header">
                  <h4 className="community-user-name">{user.name}</h4>
                  <span className={`community-user-badge ${getBadgeColor(user.badge).replace('bg-', '')}`}>
                    {user.badge === 'gold'
                      ? 'Zlato'
                      : user.badge === 'silver'
                      ? 'Srebro'
                      : 'Bronza'}
                  </span>
                </div>
                <p className="community-user-level">Level {user.level}</p>
              </div>

              {/* Points */}
              <div className="community-user-points">
                <p className="community-user-points-value">{user.points}</p>
                <p className="community-user-points-label">poena</p>
              </div>
            </div>

            {/* Action */}
            <div className="community-user-action">
              <button className="community-user-button">
                Pogledaj profil
              </button>
            </div>
          </motion.div>
        ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
