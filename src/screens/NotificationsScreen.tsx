import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/common/BottomNav';
import { ArrowLeft, Bell, Trophy, Users, Lightbulb, CheckCheck, Trash2 } from 'lucide-react';
import { useContext } from 'react';
import { NavigationContext } from '../App';
import '../styles/NotificationsScreen.css';

type Notification = {
  id: number;
  type: 'challenge' | 'achievement' | 'community' | 'tip';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  color: string;
};

export function NotificationsScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'challenge',
      title: 'Nova misija dostupna',
      message: 'Izazov "Sedmica bez plastike" je sada dostupan!',
      time: 'Prije 5 min',
      read: false,
      icon: Trophy,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      id: 2,
      type: 'achievement',
      title: 'Završio si izazov',
      message: 'Čestitamo! Završio si "Recikliraj 10 flaša" i osvojio 100 poena.',
      time: 'Prije 2 sata',
      read: false,
      icon: Trophy,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 3,
      type: 'community',
      title: 'Zajednica ti je čestitala!',
      message: 'Ana Petrović i još 12 ljudi su lajkovali tvoj napredak.',
      time: 'Prije 5 sati',
      read: false,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 4,
      type: 'tip',
      title: 'Savjet dana',
      message: 'Isključi svjetla kad izlaziš iz sobe i uštedi do 15% energije.',
      time: 'Prije 1 dan',
      read: true,
      icon: Lightbulb,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 5,
      type: 'achievement',
      title: 'Novi nivo otkljucan',
      message: 'Napredovao si na Level 3! Nastavi tako!',
      time: 'Prije 2 dana',
      read: true,
      icon: Trophy,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 6,
      type: 'community',
      title: 'Rang lista ažurirana',
      message: 'Napredovao si na 42. mjesto! Još malo do top 40!',
      time: 'Prije 3 dana',
      read: true,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIconClass = (color: string) => {
    if (color.includes('yellow') && color.includes('orange')) return 'yellow-orange';
    if (color.includes('green') && color.includes('emerald')) return 'green-emerald';
    if (color.includes('purple') && color.includes('pink')) return 'purple-pink';
    if (color.includes('blue') && color.includes('cyan')) return 'blue-cyan';
    return 'yellow-orange';
  };

  return (
    <div className="notifications-screen">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-controls">
          <button
            onClick={() => navigateTo('home')}
            className="notifications-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Nazad
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="notifications-mark-read-button"
            >
              <CheckCheck className="w-4 h-4" />
              Označi sve kao pročitano
            </button>
          )}
        </div>
        <div className="notifications-title-section">
          <div className="notifications-bell-container">
            <Bell className="notifications-bell-icon" />
            {unreadCount > 0 && (
              <div className="notifications-unread-badge">
                {unreadCount}
              </div>
            )}
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="notifications-title"
            >
              Obavještenja
            </motion.h1>
            <p className="notifications-subtitle">
              {unreadCount > 0
                ? `${unreadCount} nepročitanih obavještenja`
                : 'Sve je pročitano'}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <h3 className="notifications-empty-title">Nema obavještenja</h3>
            <p className="notifications-empty-text">Ovdje će se pojaviti tvoja obavještenja</p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-content">
                {/* Icon */}
                <div className={`notification-icon ${getNotificationIconClass(notification.color)}`}>
                  <notification.icon />
                </div>

                {/* Content */}
                <div className="notification-text">
                  <div className="notification-header">
                    <h3 className={`notification-title ${notification.read ? 'read' : 'unread'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="notification-unread-dot" />
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">{notification.time}</span>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="notification-delete-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <div className="notifications-quick-actions">
          <div className="quick-actions-container">
            <h3 className="quick-actions-title">Brze akcije</h3>
            <div className="quick-actions-grid">
              <button
                onClick={() => navigateTo('challenges')}
                className="quick-action-button"
              >
                <Trophy className="w-4 h-4" />
                Izazovi
              </button>
              <button
                onClick={() => navigateTo('ecoTips')}
                className="quick-action-button"
              >
                <Lightbulb className="w-4 h-4" />
                Eko savjeti
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
