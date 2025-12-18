import React, { useState } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  Search,
  Users,
  MessageCircle,
  ChevronRight,
  Filter,
  Star,
  Flame,
  UserPlus,
} from "lucide-react";
import "../styles/FriendSystemScreen.css";

type Friend = {
  id: number;
  name: string;
  avatar: string;
  level: number;
  points: number;
  status: "online" | "offline" | "away";
  isFriend: boolean;
  rank: number;
  city: string;
  badge: "bronze" | "silver" | "gold";
  streak: number;
};

type Group = {
  id: number;
  name: string;
  description: string;
  members: number;
  category: string;
  isJoined: boolean;
  ecoPoints: number;
};

type Activity = {
  id: number;
  userName: string;
  action: string;
  time: string;
  points: number;
  type: "challenge" | "photo" | "group" | "friend";
};

export function FriendSystemScreen() {
  const [activeTab, setActiveTab] = useState<"friends" | "groups" | "activity">(
    "friends"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const friends: Friend[] = [
    {
      id: 1,
      name: "Ana Petrović",
      avatar: "AP",
      level: 8,
      points: 5240,
      status: "online",
      isFriend: true,
      rank: 1,
      city: "Beograd",
      badge: "gold",
      streak: 12,
    },
    {
      id: 2,
      name: "Nikola Jovanović",
      avatar: "NJ",
      level: 7,
      points: 4890,
      status: "online",
      isFriend: true,
      rank: 2,
      city: "Novi Sad",
      badge: "gold",
      streak: 8,
    },
    {
      id: 3,
      name: "Jelena Marković",
      avatar: "JM",
      level: 7,
      points: 4320,
      status: "away",
      isFriend: true,
      rank: 3,
      city: "Niš",
      badge: "gold",
      streak: 15,
    },
    {
      id: 4,
      name: "Stefan Ilić",
      avatar: "SI",
      level: 6,
      points: 3870,
      status: "offline",
      isFriend: true,
      rank: 4,
      city: "Kragujevac",
      badge: "silver",
      streak: 5,
    },
    {
      id: 5,
      name: "Milica Đorđević",
      avatar: "MD",
      level: 6,
      points: 3540,
      status: "online",
      isFriend: true,
      rank: 5,
      city: "Subotica",
      badge: "silver",
      streak: 9,
    },
  ];

  const suggestedFriends: Friend[] = [
    {
      id: 6,
      name: "Luka Nikolić",
      avatar: "LN",
      level: 5,
      points: 3210,
      status: "online",
      isFriend: false,
      rank: 6,
      city: "Čačak",
      badge: "silver",
      streak: 3,
    },
    {
      id: 7,
      name: "Tijana Stanković",
      avatar: "TS",
      level: 5,
      points: 2890,
      status: "away",
      isFriend: false,
      rank: 7,
      city: "Zrenjanin",
      badge: "silver",
      streak: 7,
    },
    {
      id: 8,
      name: "Marko Pavlović",
      avatar: "MP",
      level: 3,
      points: 2450,
      status: "online",
      isFriend: false,
      rank: 8,
      city: "Pančevo",
      badge: "bronze",
      streak: 2,
    },
    {
      id: 9,
      name: "Sara Simić",
      avatar: "SS",
      level: 4,
      points: 2120,
      status: "offline",
      isFriend: false,
      rank: 9,
      city: "Smederevo",
      badge: "bronze",
      streak: 4,
    },
  ];

  const groups: Group[] = [
    {
      id: 1,
      name: "Eko Biciklisti",
      description: "Promovišemo biciklizam kao održiv vid transporta",
      members: 245,
      category: "Transport",
      isJoined: true,
      ecoPoints: 12500,
    },
    {
      id: 2,
      name: "Reciklaža Heroji",
      description: "Zajednička borba za bolju reciklažu",
      members: 189,
      category: "Reciklaža",
      isJoined: true,
      ecoPoints: 8900,
    },
    {
      id: 3,
      name: "Solar Energy",
      description: "Dijelimo znanje o solarnoj energiji",
      members: 156,
      category: "Energija",
      isJoined: false,
      ecoPoints: 6700,
    },
    {
      id: 4,
      name: "Voda Čuvari",
      description: "Štednja vode i zaštita vodenih resursa",
      members: 98,
      category: "Voda",
      isJoined: false,
      ecoPoints: 4300,
    },
    {
      id: 5,
      name: "Urban Gardeners",
      description: "Urbanog vrtlarstvo i održiva poljoprivreda",
      members: 167,
      category: "Hrana",
      isJoined: true,
      ecoPoints: 7200,
    },
    {
      id: 6,
      name: "Zero Waste",
      description: "Život bez otpada - korak po korak",
      members: 312,
      category: "Održivost",
      isJoined: false,
      ecoPoints: 15800,
    },
  ];

  const activities: Activity[] = [
    {
      id: 1,
      userName: "Ana Petrović",
      action: 'završila izazov "Bicikl na posao"',
      time: "Prije 2 sata",
      points: 150,
      type: "challenge",
    },
    {
      id: 2,
      userName: "Nikola Jovanović",
      action: "dodao novu fotografiju reciklaže",
      time: "Prije 3 sata",
      points: 75,
      type: "photo",
    },
    {
      id: 3,
      userName: "Eko Biciklisti",
      action: "organizovali grupnu vožnju",
      time: "Juče",
      points: 200,
      type: "group",
    },
    {
      id: 4,
      userName: "Jelena Marković",
      action: "dostigla novi rekord u streak-u",
      time: "Prije 1 dan",
      points: 100,
      type: "friend",
    },
    {
      id: 5,
      userName: "Urban Gardeners",
      action: 'dodali novi izazov "Posadi drvo"',
      time: "Prije 2 dana",
      points: 100,
      type: "group",
    },
  ];

  const [friendList, setFriendList] = useState<Friend[]>(friends);
  const [suggestedList, setSuggestedList] =
    useState<Friend[]>(suggestedFriends);
  const [groupList, setGroupList] = useState<Group[]>(groups);
  const [activityList] = useState<Activity[]>(activities);

  const handleAddFriend = (friendId: number) => {
    setSuggestedList((prev) =>
      prev.map((friend) =>
        friend.id === friendId ? { ...friend, isFriend: true } : friend
      )
    );
    // Ovdje bi poslao notifikaciju (preko notifikacija screena)
  };

  const handleJoinGroup = (groupId: number) => {
    setGroupList((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, isJoined: true } : group
      )
    );
  };

  const handleLeaveGroup = (groupId: number) => {
    setGroupList((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, isJoined: false } : group
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#22c55e"; // green-500
      case "away":
        return "#f59e0b"; // amber-500
      case "offline":
        return "#6b7280"; // gray-500
      default:
        return "#6b7280";
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "gold":
        return "bg-gradient-to-br from-yellow-500 to-yellow-600";
      case "silver":
        return "bg-gradient-to-br from-gray-400 to-gray-600";
      case "bronze":
        return "bg-gradient-to-br from-amber-700 to-amber-900";
      default:
        return "bg-gray-600";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "transport":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "reciklaža":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "energija":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "voda":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "hrana":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "održivost":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const filteredFriends = friendList.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groupList.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activityList.filter(
    (activity) =>
      activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="friend-system-screen">
      {/* Header - Sličan kao HomeScreen */}
      <div className="friend-header">
        <div className="friend-header-content">
          <div className="friend-header-text">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="friend-title"
            >
              Prijatelji
            </motion.h1>
            <p className="friend-subtitle">Poveži se sa Eco Guardianima</p>
          </div>
        </div>

        {/* Search Bar - Isti kao HomeScreen */}
        <div className="friend-search-container">
          <div className="friend-search">
            <Search className="friend-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pronađi prijatelje, grupe..."
              className="friend-search-input"
            />
            <Filter className="friend-filter-icon" />
          </div>
        </div>

        {/* Tabs - Poboljšani izgled */}
        <div className="friend-tabs">
          <button
            onClick={() => setActiveTab("friends")}
            className={`friend-tab ${activeTab === "friends" ? "active" : ""}`}
          >
            <Users className="friend-tab-icon" />
            <span>Prijatelji</span>
            <span className="tab-count">{friendList.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`friend-tab ${activeTab === "groups" ? "active" : ""}`}
          >
            <Users className="friend-tab-icon" />
            <span>Grupe</span>
            <span className="tab-count">{groupList.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`friend-tab ${activeTab === "activity" ? "active" : ""}`}
          >
            <Star className="friend-tab-icon" />
            <span>Aktivnosti</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="friend-content">
        {activeTab === "friends" && (
          <div className="friends-container">
            {/* Moji prijatelji - Kartice kao na HomeScreen */}
            <div className="friend-section">
              <h3 className="friend-section-title">Moji prijatelji</h3>
              <div className="friend-cards-grid">
                {filteredFriends.map((friend, index) => (
                  <motion.div
                    key={`friend-${friend.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="friend-card"
                  >
                    <div className="friend-card-content">
                      {/* Avatar sa statusom */}
                      <div className="friend-avatar-container">
                        <div
                          className={`friend-avatar ${getBadgeColor(
                            friend.badge
                          )}`}
                        >
                          {friend.avatar}
                        </div>
                        <div
                          className="friend-status"
                          style={{
                            backgroundColor: getStatusColor(friend.status),
                          }}
                        />
                      </div>

                      {/* Friend info */}
                      <div className="friend-info">
                        <div className="friend-info-header">
                          <h4 className="friend-name">{friend.name}</h4>
                          <span className="friend-rank">#{friend.rank}</span>
                        </div>

                        <div className="friend-details">
                          <span className="friend-city">{friend.city}</span>
                          <span className="friend-level">
                            Level {friend.level}
                          </span>
                        </div>

                        {/* Stats - kao na HomeScreen */}
                        <div className="friend-stats">
                          <div className="friend-stat">
                            <Star className="friend-stat-icon" />
                            <span className="friend-stat-value">
                              {friend.points.toLocaleString()}
                            </span>
                            <span className="friend-stat-label">poena</span>
                          </div>
                          <div className="friend-stat">
                            <Flame className="friend-stat-icon" />
                            <span className="friend-stat-value">
                              {friend.streak}
                            </span>
                            <span className="friend-stat-label">streak</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="friend-actions">
                      <button className="friend-action-btn message-btn">
                        <MessageCircle className="w-4 h-4" />
                        <span>Poruka</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Predloženi prijatelji */}
            <div className="friend-section">
              <h3 className="friend-section-title">Predloženi prijatelji</h3>
              <div className="friend-cards-grid">
                {suggestedList.map((friend, index) => (
                  <motion.div
                    key={`suggested-${friend.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="friend-card"
                  >
                    <div className="friend-card-content">
                      <div className="friend-avatar-container">
                        <div
                          className={`friend-avatar ${getBadgeColor(
                            friend.badge
                          )}`}
                        >
                          {friend.avatar}
                        </div>
                        <div
                          className="friend-status"
                          style={{
                            backgroundColor: getStatusColor(friend.status),
                          }}
                        />
                      </div>

                      <div className="friend-info">
                        <div className="friend-info-header">
                          <h4 className="friend-name">{friend.name}</h4>
                          <span className="friend-rank">#{friend.rank}</span>
                        </div>

                        <div className="friend-details">
                          <span className="friend-city">{friend.city}</span>
                          <span className="friend-level">
                            Level {friend.level}
                          </span>
                        </div>

                        <div className="friend-stats">
                          <div className="friend-stat">
                            <Star className="friend-stat-icon" />
                            <span className="friend-stat-value">
                              {friend.points.toLocaleString()}
                            </span>
                            <span className="friend-stat-label">poena</span>
                          </div>
                          <div className="friend-stat">
                            <Flame className="friend-stat-icon" />
                            <span className="friend-stat-value">
                              {friend.streak}
                            </span>
                            <span className="friend-stat-label">streak</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="friend-actions">
                      {friend.isFriend ? (
                        <button
                          className="friend-action-btn added-btn"
                          disabled
                        >
                          <span>Dodano</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(friend.id)}
                          className="friend-action-btn add-btn"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Dodaj</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="groups-container">
            <div className="friend-section">
              <h3 className="friend-section-title">Grupe</h3>
              <div className="group-cards-grid">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={`group-${group.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group-card"
                  >
                    <div className="group-card-content">
                      <div className="group-header">
                        <h4 className="group-name">{group.name}</h4>
                        <span
                          className={`group-category ${getCategoryColor(
                            group.category
                          )}`}
                        >
                          {group.category}
                        </span>
                      </div>

                      <p className="group-description">{group.description}</p>

                      <div className="group-stats">
                        <div className="group-stat">
                          <Users className="group-stat-icon" />
                          <span className="group-stat-value">
                            {group.members}
                          </span>
                          <span className="group-stat-label">članova</span>
                        </div>
                        <div className="group-stat">
                          <Star className="group-stat-icon" />
                          <span className="group-stat-value">
                            {group.ecoPoints.toLocaleString()}
                          </span>
                          <span className="group-stat-label">poena</span>
                        </div>
                      </div>
                    </div>

                    <div className="group-actions">
                      {group.isJoined ? (
                        <button
                          onClick={() => handleLeaveGroup(group.id)}
                          className="group-action-btn leave-btn"
                        >
                          <span>Napusti</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          className="group-action-btn join-btn"
                        >
                          <span>Pridruži se</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="activity-container">
            <div className="friend-section">
              <h3 className="friend-section-title">Aktivnosti prijatelja</h3>
              <div className="activity-list">
                {filteredActivities.map((activity, index) => (
                  <motion.div
                    key={`activity-${activity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="activity-card"
                  >
                    <div className="activity-type">
                      {activity.type === "challenge" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={24}
                          height={24}
                          viewBox="0 0 384 512"
                        >
                          <path
                            fill="#2bc154"
                            d="M378.31 378.49L298.42 288h30.63c9.01 0 16.98-5 20.78-13.06c3.8-8.04 2.55-17.26-3.28-24.05L268.42 160h28.89c9.1 0 17.3-5.35 20.86-13.61c3.52-8.13 1.86-17.59-4.24-24.08L203.66 4.83c-6.03-6.45-17.28-6.45-23.32 0L70.06 122.31c-6.1 6.49-7.75 15.95-4.24 24.08C69.38 154.65 77.59 160 86.69 160h28.89l-78.14 90.91c-5.81 6.78-7.06 15.99-3.27 24.04C37.97 283 45.93 288 54.95 288h30.63L5.69 378.49c-6 6.79-7.36 16.09-3.56 24.26c3.75 8.05 12 13.25 21.01 13.25H160v24.45l-30.29 48.4c-5.32 10.64 2.42 23.16 14.31 23.16h95.96c11.89 0 19.63-12.52 14.31-23.16L224 440.45V416h136.86c9.01 0 17.26-5.2 21.01-13.25c3.8-8.17 2.44-17.47-3.56-24.26"
                          ></path>
                        </svg>
                      )}
                      {activity.type === "photo" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={24}
                          height={24}
                          viewBox="0 0 384 512"
                        >
                          <path
                            fill="#2bc154"
                            d="M378.31 378.49L298.42 288h30.63c9.01 0 16.98-5 20.78-13.06c3.8-8.04 2.55-17.26-3.28-24.05L268.42 160h28.89c9.1 0 17.3-5.35 20.86-13.61c3.52-8.13 1.86-17.59-4.24-24.08L203.66 4.83c-6.03-6.45-17.28-6.45-23.32 0L70.06 122.31c-6.1 6.49-7.75 15.95-4.24 24.08C69.38 154.65 77.59 160 86.69 160h28.89l-78.14 90.91c-5.81 6.78-7.06 15.99-3.27 24.04C37.97 283 45.93 288 54.95 288h30.63L5.69 378.49c-6 6.79-7.36 16.09-3.56 24.26c3.75 8.05 12 13.25 21.01 13.25H160v24.45l-30.29 48.4c-5.32 10.64 2.42 23.16 14.31 23.16h95.96c11.89 0 19.63-12.52 14.31-23.16L224 440.45V416h136.86c9.01 0 17.26-5.2 21.01-13.25c3.8-8.17 2.44-17.47-3.56-24.26"
                          ></path>
                        </svg>
                      )}
                      {activity.type === "group" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={24}
                          height={24}
                          viewBox="0 0 512 512"
                        >
                          <circle
                            cx={152}
                            cy={184}
                            r={72}
                            fill="#2bc154"
                          ></circle>
                          <path
                            fill="#2bc154"
                            d="M234 296c-28.16-14.3-59.24-20-82-20c-44.58 0-136 27.34-136 82v42h150v-16.07c0-19 8-38.05 22-53.93c11.17-12.68 26.81-24.45 46-34"
                          ></path>
                          <path
                            fill="#2bc154"
                            d="M340 288c-52.07 0-156 32.16-156 96v48h312v-48c0-63.84-103.93-96-156-96"
                          ></path>
                          <circle
                            cx={340}
                            cy={168}
                            r={88}
                            fill="#2bc154"
                          ></circle>
                        </svg>
                      )}
                      {activity.type === "friend" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={24}
                          height={24}
                          viewBox="0 0 512 512"
                        >
                          <circle
                            cx={152}
                            cy={184}
                            r={72}
                            fill="#2bc154"
                          ></circle>
                          <path
                            fill="#2bc154"
                            d="M234 296c-28.16-14.3-59.24-20-82-20c-44.58 0-136 27.34-136 82v42h150v-16.07c0-19 8-38.05 22-53.93c11.17-12.68 26.81-24.45 46-34"
                          ></path>
                          <path
                            fill="#2bc154"
                            d="M340 288c-52.07 0-156 32.16-156 96v48h312v-48c0-63.84-103.93-96-156-96"
                          ></path>
                          <circle
                            cx={340}
                            cy={168}
                            r={88}
                            fill="#2bc154"
                          ></circle>
                        </svg>
                      )}
                    </div>

                    <div className="activity-content">
                      <div className="activity-header">
                        <h4 className="activity-user">{activity.userName}</h4>
                        <span className="activity-time">{activity.time}</span>
                      </div>

                      <p className="activity-action">{activity.action}</p>

                      {activity.points > 0 && (
                        <div className="activity-points">
                          <Star className="w-3 h-3" />
                          <span>+{activity.points} poena</span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="activity-chevron" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
