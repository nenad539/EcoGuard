import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import { Search, Trophy, Medal, Camera, CheckCircle } from "lucide-react";
import "../styles/CommunityScreen.css";

type User = {
  id: number;
  name: string;
  points: number;
  level: number;
  avatar?: string;
  badge: "bronze" | "silver" | "gold";
  rank: number;
  photoChallenges: number;
  challengesCompleted: number;
};

export function CommunityScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "bronze" | "silver" | "gold"
  >("all");

  const users: User[] = [
    {
      id: 1,
      name: "Ana Petrović",
      points: 5240,
      level: 8,
      badge: "gold",
      rank: 1,
      photoChallenges: 28,
      challengesCompleted: 45,
    },
    {
      id: 2,
      name: "Nikola Jovanović",
      points: 4890,
      level: 7,
      badge: "gold",
      rank: 2,
      photoChallenges: 24,
      challengesCompleted: 42,
    },
    {
      id: 3,
      name: "Jelena Marković",
      points: 4320,
      level: 7,
      badge: "gold",
      rank: 3,
      photoChallenges: 21,
      challengesCompleted: 38,
    },
    {
      id: 4,
      name: "Stefan Ilić",
      points: 3870,
      level: 6,
      badge: "silver",
      rank: 4,
      photoChallenges: 18,
      challengesCompleted: 34,
    },
    {
      id: 5,
      name: "Milica Đorđević",
      points: 3540,
      level: 6,
      badge: "silver",
      rank: 5,
      photoChallenges: 16,
      challengesCompleted: 31,
    },
    {
      id: 6,
      name: "Luka Nikolić",
      points: 3210,
      level: 5,
      badge: "silver",
      rank: 6,
      photoChallenges: 14,
      challengesCompleted: 28,
    },
    {
      id: 7,
      name: "Tijana Stanković",
      points: 2890,
      level: 5,
      badge: "silver",
      rank: 7,
      photoChallenges: 12,
      challengesCompleted: 25,
    },
    {
      id: 8,
      name: "Marko Pavlović",
      points: 2450,
      level: 3,
      badge: "bronze",
      rank: 8,
      photoChallenges: 10,
      challengesCompleted: 22,
    },
    {
      id: 9,
      name: "Sara Simić",
      points: 2120,
      level: 4,
      badge: "bronze",
      rank: 9,
      photoChallenges: 8,
      challengesCompleted: 19,
    },
    {
      id: 10,
      name: "David Kostić",
      points: 1980,
      level: 4,
      badge: "bronze",
      rank: 10,
      photoChallenges: 6,
      challengesCompleted: 16,
    },
  ];

  // Funkcija za filtriranje korisnika
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filtriraj po pretrazi
      const matchesSearch = user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filtriraj po filteru
      const matchesFilter =
        activeFilter === "all" || user.badge === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "gold":
        return "yellow-500";
      case "silver":
        return "slate-400";
      case "bronze":
        return "amber-600";
      default:
        return "slate-500";
    }
  };

  const getBadgeClass = (badge: string) => {
    switch (badge) {
      case "gold":
        return "community-user-badge gold";
      case "silver":
        return "community-user-badge silver";
      case "bronze":
        return "community-user-badge bronze";
      default:
        return "community-user-badge";
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="community-rank-icon-gold" />;
    if (rank === 2) return <Medal className="community-rank-icon-silver" />;
    if (rank === 3) return <Medal className="community-rank-icon-bronze" />;
    return null;
  };

  // Top 3 korisnici (uvijek prva 3 mjesta)
  const topThreeUsers = users.filter((user) => user.rank <= 3);

  // Filtriraj korisnike za listu (svi koji odgovaraju filterima)
  const listUsers = useMemo(() => {
    // Ako nema filtera, vrati sve korisnike
    if (activeFilter === "all" && searchQuery === "") {
      return users;
    }
    return filteredUsers;
  }, [filteredUsers, activeFilter, searchQuery]);

  return (
    <div className="community-screen">
      {/* Header */}
      <div className="community-header">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="community-title"
        >
          Zajednica{" "}
          <svg
            className="inline-block"
            xmlns="http://www.w3.org/2000/svg"
            width={30}
            height={30}
            viewBox="0 0 512 512"
          >
            <circle cx={152} cy={184} r={72} fill="#2bc154"></circle>
            <path
              fill="#2bc154"
              d="M234 296c-28.16-14.3-59.24-20-82-20c-44.58 0-136 27.34-136 82v42h150v-16.07c0-19 8-38.05 22-53.93c11.17-12.68 26.81-24.45 46-34"
            ></path>
            <path
              fill="#2bc154"
              d="M340 288c-52.07 0-156 32.16-156 96v48h312v-48c0-63.84-103.93-96-156-96"
            ></path>
            <circle cx={340} cy={168} r={88} fill="#2bc154"></circle>
          </svg>
        </motion.h1>
        <p className="community-subtitle">Top 10 EcoGuarda</p>

        {/* Search Bar */}
        <div className="community-search">
          <Search className="community-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Pronađi korisnika…"
            className="community-search-input"
          />
        </div>

        {/* Filter Tabs */}
        <div className="community-filter-tabs">
          {["Svi", "Bronzani", "Srebrni", "Zlatni"].map((filter, index) => {
            const filterKey =
              index === 0
                ? "all"
                : index === 1
                ? "bronze"
                : index === 2
                ? "silver"
                : "gold";

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filterKey as any)}
                className={`community-filter-tab ${
                  activeFilter === filterKey ? "active" : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Podium - UVIJEK prikazuje prva 3 mjesta */}
      <div className="community-leaderboard">
        <div className="community-podium">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="community-podium-item second"
          >
            <div className="community-podium-rank second">
              <Medal className="w-4 h-4" />
            </div>
            <div className="community-podium-avatar">
              {users[1].name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <p className="community-podium-name">
              {users[1].name.split(" ")[0]}
            </p>
            <p className="community-podium-points">{users[1].points} pts</p>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="community-podium-item first"
          >
            <div className="community-podium-rank first">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="community-podium-avatar">
              {users[0].name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <p className="community-podium-name">
              {users[0].name.split(" ")[0]}
            </p>
            <p className="community-podium-points">{users[0].points} pts</p>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="community-podium-item third"
          >
            <div className="community-podium-rank third">
              <Medal className="w-4 h-4" />
            </div>
            <div className="community-podium-avatar">
              {users[2].name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <p className="community-podium-name">
              {users[2].name.split(" ")[0]}
            </p>
            <p className="community-podium-points">{users[2].points} pts</p>
          </motion.div>
        </div>

        {/* Leaderboard List - SVI korisnici (uključujući top 3) */}
        <div className="community-user-list">
          {listUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: user.rank * 0.05 }}
              className={`community-user-item ${
                user.rank <= 3 ? "community-user-item-top" : ""
              }`}
            >
              <div className="community-user-content">
                {/* Avatar */}
                <div
                  className={`community-user-avatar ${getBadgeColor(
                    user.badge
                  ).replace("bg-", "")}`}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                {/* Info */}
                <div className="community-user-info">
                  <div className="community-user-info-header">
                    <h4 className="community-user-name">{user.name}</h4>
                    <span className={getBadgeClass(user.badge)}>
                      {user.badge.charAt(0).toUpperCase() + user.badge.slice(1)}
                    </span>
                  </div>
                  <div className="community-user-stats">
                    <span className="community-user-level">
                      Level {user.level}
                    </span>
                    <div className="community-user-stat-items">
                      <div className="community-user-stat">
                        <Camera className="community-user-stat-icon" />
                        <span>{user.photoChallenges}</span>
                      </div>
                      <div className="community-user-stat">
                        <CheckCircle className="community-user-stat-icon" />
                        <span>{user.challengesCompleted}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points and Rank Container */}
                <div className="community-user-points-container">
                  {/* Points */}
                  <div className="community-user-points">
                    <p className="community-user-points-value">{user.points}</p>
                    <p className="community-user-points-label">poena</p>
                  </div>

                  {/* Rank - centriran desno od poena */}
                  <div className="community-user-rank-right">
                    {getRankIcon(user.rank) || (
                      <span className="community-user-rank-number">
                        {user.rank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Poruka ako nema rezultata */}
          {listUsers.length === 0 && (
            <div className="community-no-results">
              <p>Nema korisnika koji odgovaraju pretrazi</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="community-reset-btn"
              >
                Poništi filtere
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}