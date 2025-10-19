import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { NavigationContext } from '../App';
import { BottomNav } from '../components/common/BottomNav';
import { Recycle, Zap, CloudRain, Star, Bell, User } from 'lucide-react';
import '../styles/HomeScreen.css';

export function HomeScreen() {
  const { userData, navigateTo } = useContext(NavigationContext);

  const stats = [
    {
      icon: Recycle,
      label: 'Reciklirano',
      value: userData.recycled,
      unit: 'stvari',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Zap,
      label: 'Sačuvana energija',
      value: userData.energySaved,
      unit: 'kWh',
      gradient: 'from-yellow-500 to-orange-600',
    },
    {
      icon: CloudRain,
      label: 'Smanjen CO₂',
      value: userData.co2Reduced,
      unit: 'kg',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Star,
      label: 'Ukupni poeni',
      value: userData.points,
      unit: 'poena',
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="home-welcome"
            >
              Dobrodošao nazad, {userData.name} 🌱
            </motion.h1>
            <p className="home-level">Eco Čuvar Lv.{userData.level}</p>
          </div>
          <div className="home-nav-buttons">
            <button
              onClick={() => navigateTo('notifications')}
              className="home-nav-button"
            >
              <Bell />
            </button>
            <button
              onClick={() => navigateTo('profile')}
              className="home-profile-button"
            >
              <User />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="home-stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="home-stat-card"
            >
              <div className={`home-stat-icon ${stat.gradient.includes('green') ? 'green' : stat.gradient.includes('yellow') ? 'yellow' : stat.gradient.includes('blue') ? 'blue' : 'purple'}`}>
                <stat.icon />
              </div>
              <p className="home-stat-label">{stat.label}</p>
              <p className="home-stat-value">
                {stat.value}
                <span className="home-stat-unit">{stat.unit}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => navigateTo('challenges')}
            className="home-cta-button"
          >
            <Star />
            Započni novi izazov
          </button>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="home-section">
        <h2 className="home-section-title">Nedavne aktivnosti</h2>
        <div className="home-activity-list">
          {[
            { title: 'Reciklirano 5 PET flaša', time: 'Prije 2 sata', points: '+50' },
            { title: 'Završen izazov "Bicikl vikendom"', time: 'Prije 1 dan', points: '+120' },
            { title: 'Posađeno drvo u parku', time: 'Prije 3 dana', points: '+200' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="home-activity-item"
            >
              <div>
                <p className="home-activity-title">{activity.title}</p>
                <p className="home-activity-time">{activity.time}</p>
              </div>
              <div className="home-activity-points">{activity.points}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-section">
        <h2 className="home-section-title">Brze akcije</h2>
        <div className="home-quick-actions">
          <button
            onClick={() => navigateTo('ecoTips')}
            className="home-quick-action"
          >
            <div className="home-quick-action-emoji">💡</div>
            <p className="home-quick-action-title">Eko savjeti</p>
            <p className="home-quick-action-subtitle">Saznaj više</p>
          </button>
          <button
            onClick={() => navigateTo('community')}
            className="home-quick-action purple"
          >
            <div className="home-quick-action-emoji">👥</div>
            <p className="home-quick-action-title">Zajednica</p>
            <p className="home-quick-action-subtitle">Rang lista</p>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
