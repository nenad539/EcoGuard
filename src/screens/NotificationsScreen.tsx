import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  ArrowLeft,
  Bell,
  Trophy,
  Users,
  Lightbulb,
  CheckCheck,
  Trash2,
  UserPlus,
  MessageCircle,
  Award,
  Users as UsersIcon,
  Star,
} from "lucide-react";
import { useContext } from "react";
import { NavigationContext } from "../App";
import "../styles/NotificationsScreen.css";

type Notification = {
  id: number;
  type:
    | "challenge"
    | "achievement"
    | "community"
    | "tip"
    | "friend_request"
    | "friend_activity"
    | "group";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  color: string;
  friendId?: number;
  groupId?: number;
  action?: "accept" | "decline" | "view";
};

export function NotificationsScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [notifications, setNotifications] = useState<Notification[]>([
    // Postojeće notifikacije
    {
      id: 1,
      type: "challenge",
      title: "Nova misija dostupna",
      message: 'Izazov "Sedmica bez plastike" je sada dostupan!',
      time: "Prije 5 min",
      read: false,
      icon: Trophy,
      color: "yellow-orange",
    },
    {
      id: 2,
      type: "achievement",
      title: "Završio si izazov",
      message:
        'Čestitamo! Završio si "Recikliraj 10 flaša" i osvojio 100 poena.',
      time: "Prije 2 sata",
      read: false,
      icon: Trophy,
      color: "green-emerald",
    },
    // NOVE FRIEND NOTIFIKACIJE:
    {
      id: 3,
      type: "friend_request",
      title: "Novi zahtjev za prijateljstvo",
      message: "David Kostić te dodao za prijatelja",
      time: "Prije 15 min",
      read: false,
      icon: UserPlus,
      color: "purple-pink",
      friendId: 10,
      action: "accept",
    },
    {
      id: 4,
      type: "friend_activity",
      title: "Tvoj prijatelj je osvojio poene",
      message:
        'Ana Petrović je završila izazov "Bicikl na posao" i osvojila 150 poena',
      time: "Prije 2 sata",
      read: false,
      icon: Users,
      color: "blue-cyan",
      friendId: 1,
      action: "view",
    },
    {
      id: 5,
      type: "group",
      title: "Nova grupa za tebe",
      message: "Eko Biciklisti - pridruži se grupnoj vožnji ovog vikenda",
      time: "Prije 1 dan",
      read: false,
      icon: UsersIcon,
      color: "green-emerald",
      groupId: 1,
      action: "view",
    },
    {
      id: 6,
      type: "friend_activity",
      title: "Prijatelj je dostigao novi nivo",
      message: "Nikola Jovanović je dostigao Level 7! Čestitamo!",
      time: "Prije 3 dana",
      read: true,
      icon: Award,
      color: "yellow-orange",
      friendId: 2,
      action: "view",
    },
    {
      id: 7,
      type: "friend_request",
      title: "Zahtjev za prijateljstvo prihvaćen",
      message: "Milan Popović je prihvatio tvoj zahtjev za prijateljstvo",
      time: "Prije 4 dana",
      read: true,
      icon: UserPlus,
      color: "green-emerald",
      friendId: 11,
      action: "view",
    },
    // Ostale postojeće notifikacije...
    {
      id: 8,
      type: "community",
      title: "Zajednica ti je čestitala!",
      message: "Ana Petrović i još 12 ljudi su lajkovali tvoj napredak.",
      time: "Prije 5 sati",
      read: false,
      icon: Users,
      color: "purple-pink",
    },
    {
      id: 9,
      type: "tip",
      title: "Savjet dana",
      message: "Isključi svjetla kad izlaziš iz sobe i uštedi do 15% energije.",
      time: "Prije 1 dan",
      read: true,
      icon: Lightbulb,
      color: "blue-cyan",
    },
  ]);

  // Funkcije za rukovanje friend notifikacijama
  const handleFriendRequest = (id: number, accept: boolean) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
              title: accept ? "Zahtjev prihvaćen" : "Zahtjev odbijen",
              message: accept
                ? "Prihvatili ste zahtjev za prijateljstvo"
                : "Odbili ste zahtjev za prijateljstvo",
              icon: CheckCheck,
              color: accept ? "green-emerald" : "red-red",
              action: undefined,
            }
          : notification
      )
    );

    // Ovdje bi bilo dobro pozvati API za accept/decline zahtjeva
    if (accept) {
      console.log("Zahtjev prihvaćen za friendId:", id);
    } else {
      console.log("Zahtjev odbijen za friendId:", id);
    }
  };

  const handleViewFriend = (friendId: number) => {
    navigateTo("friends");
    console.log("Pogledaj prijatelja ID:", friendId);
  };

  const handleJoinGroup = (groupId: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === groupId
          ? {
              ...notification,
              read: true,
              title: "Pridružio si se grupi",
              message: "Sada si član grupe!",
              icon: UsersIcon,
              color: "green-emerald",
              action: undefined,
            }
          : notification
      )
    );
    console.log("Pridruži se grupi ID:", groupId);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Funkcija za dobijanje ikone za akciju
  const getActionButton = (notification: Notification) => {
    if (!notification.action) return null;

    switch (notification.action) {
      case "accept":
        return (
          <div className="notification-actions">
            <button
              onClick={() => handleFriendRequest(notification.id, true)}
              className="action-btn accept-btn"
            >
              <CheckCheck className="w-4 h-4" />
              Prihvati
            </button>
            <button
              onClick={() => handleFriendRequest(notification.id, false)}
              className="action-btn decline-btn"
            >
              ✕ Odbij
            </button>
          </div>
        );
      case "view":
        if (notification.friendId) {
          return (
            <button
              onClick={() => handleViewFriend(notification.friendId!)}
              className="action-btn view-btn"
            >
              <Users className="w-4 h-4" />
              Pogledaj
            </button>
          );
        } else if (notification.groupId) {
          return (
            <button
              onClick={() => handleJoinGroup(notification.id)}
              className="action-btn join-btn"
            >
              <UsersIcon className="w-4 h-4" />
              Pridruži se
            </button>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="notifications-screen">
      {/* Header */}
      <div className="notifications-header">
        <div className="notifications-header-controls">
          <button
            onClick={() => navigateTo("home")}
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
              <div className="notifications-unread-badge">{unreadCount}</div>
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
                : "Sve je pročitano"}
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
            <p className="notifications-empty-text">
              Ovdje će se pojaviti tvoja obavještenja
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`notification-item ${
                !notification.read ? "unread" : ""
              }`}
            >
              <div className="notification-content">
                {/* Icon */}
                <div className={`notification-icon ${notification.color}`}>
                  <notification.icon />
                </div>

                {/* Content */}
                <div className="notification-text">
                  <div className="notification-header">
                    <h3
                      className={`notification-title ${
                        notification.read ? "read" : "unread"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="notification-unread-dot" />
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>

                  {/* Action Buttons */}
                  {getActionButton(notification)}

                  <div className="notification-footer">
                    <span className="notification-time">
                      {notification.time}
                    </span>
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
                onClick={() => navigateTo("challenges")}
                className="quick-action-button"
              >
                <Trophy className="w-4 h-4" />
                Izazovi
              </button>
              <button
                onClick={() => navigateTo("friends")}
                className="quick-action-button"
              >
                <Users className="w-4 h-4" />
                Prijatelji
              </button>
              <button
                onClick={() => navigateTo("ecoTips")}
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
