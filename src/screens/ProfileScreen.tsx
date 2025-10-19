import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { NavigationContext } from '../App';
import { BottomNav } from '../components/common/BottomNav';
import { ArrowLeft, Edit, BarChart3, LogOut, Award, Target, Flame } from 'lucide-react';
import '../styles/ProfileScreen.css';

export function ProfileScreen() {
  const { userData, navigateTo } = useContext(NavigationContext);

  const achievements = [
    { id: 1, title: 'Prvi koraci', description: 'Završi prvi izazov', icon: '🎯', unlocked: true },
    { id: 2, title: 'Eko ratnik', description: 'Završi 10 izazova', icon: '⚔️', unlocked: true },
    { id: 3, title: 'Prijatelj prirode', description: 'Posadi 5 stabala', icon: '🌳', unlocked: true },
    { id: 4, title: 'Recikler', description: 'Recikliraj 100 predmeta', icon: '♻️', unlocked: true },
    { id: 5, title: 'Eko guru', description: 'Dostignite Level 10', icon: '🧘', unlocked: false },
    { id: 6, title: 'Lider zajednice', description: 'Budi #1 na rang listi', icon: '👑', unlocked: false },
  ];

  const stats = [
    { label: 'Izazova završeno', value: '18', icon: Target },
    { label: 'Dnevna serija', value: '12 dana', icon: Flame },
    { label: 'Ukupno poena', value: userData.points.toLocaleString(), icon: Award },
  ];

  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="profile-header">
        <button
          onClick={() => navigateTo('home')}
          className="profile-back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-card">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card-content"
        >
          <div className="profile-info">
            <div className="profile-avatar">
              {userData.name[0]}
            </div>
            <div className="profile-details">
              <h2 className="profile-name">{userData.name}</h2>
              <div className="profile-badges">
                <span className="profile-badge profile-badge-level">
                  Eco Čuvar Lv.{userData.level}
                </span>
                <span className="profile-badge profile-badge-rank">
                  Bronza
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="profile-action-button">
              <Edit className="w-4 h-4" />
              Uredi profil
            </button>
            <button
              onClick={() => navigateTo('statistics')}
              className="profile-action-button"
            >
              <BarChart3 className="w-4 h-4" />
              Statistika
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats">
        <h3 className="profile-section-title">Tvoja statistika</h3>
        <div className="profile-stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="profile-stat-card"
            >
              <div className="profile-stat-icon">
                <stat.icon />
              </div>
              <p className="profile-stat-value">{stat.value}</p>
              <p className="profile-stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="profile-achievements">
        <h3 className="profile-section-title">Dostignuća</h3>
        <div className="profile-achievements-grid">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`profile-achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className={`profile-achievement-icon ${!achievement.unlocked ? 'locked' : ''}`}>
                {achievement.icon}
              </div>
              <h4 className={`profile-achievement-title ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                {achievement.title}
              </h4>
              <p className={`profile-achievement-description ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                {achievement.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="profile-activity">
        <h3 className="profile-section-title">Nedavne aktivnosti</h3>
        <div className="profile-activity-list">
          {[
            { action: 'Završen izazov "Bicikl vikendom"', date: 'Prije 1 dan', points: '+120' },
            { action: 'Reciklirano 10 staklenih flaša', date: 'Prije 2 dana', points: '+80' },
            { action: 'Posađeno stablo u gradskom parku', date: 'Prije 5 dana', points: '+200' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="profile-activity-item"
            >
              <div className="profile-activity-content">
                <p className="profile-activity-action">{activity.action}</p>
                <p className="profile-activity-date">{activity.date}</p>
              </div>
              <div className="profile-activity-points">{activity.points}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="profile-logout">
        <button
          onClick={() => navigateTo('login')}
          className="profile-logout-button"
        >
          <LogOut className="w-4 h-4" />
          Odjavi se
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
