import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import { supabase } from "../supabase-client";
import { Search, Trophy, Medal, Camera, CheckCircle } from "lucide-react";
import "../styles/CommunityScreen.css";

type User = {
  id: string | number;
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
  const [users, setUsers] = useState<User[]>([]);
  const [bronzeUsers, setBronzeUsers] = useState<User[]>([]);
  const [bronzeOffset, setBronzeOffset] = useState(10);
  const [bronzeHasMore, setBronzeHasMore] = useState(true);
  const [loadingBronze, setLoadingBronze] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Funkcija za filtriranje korisnika
  const filteredUsers = useMemo(() => {
    const pool = activeFilter === "bronze" ? [...users, ...bronzeUsers] : users;
    return pool.filter((user) => {
      const matchesSearch = user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      
      const matchesFilter =
        activeFilter === "all" || user.badge === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, users, bronzeUsers]);

  const badgeForRank = (rank: number) => {
    if (rank <= 5) return "gold" as const;
    if (rank <= 10) return "silver" as const;
    return "bronze" as const;
  };

  const levelLabelFromPoints = (pts: number) => {
    if (pts >= 5000) return "Legenda prirode";
    if (pts >= 2500) return "Eko heroj";
    if (pts >= 1000) return "Eko borac";
    if (pts >= 500) return "Aktivan član";
    if (pts >= 100) return "Početnik";
    return "Rookie";
  };

  
  const loadLeaderboard = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    setBronzeUsers([]);
    setBronzeOffset(10);
    setBronzeHasMore(true);
    try {
      const { data, error } = await supabase
        .from("korisnik_profil")
        .select("id, korisnicko_ime, ukupno_poena, nivo")
        .order("ukupno_poena", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading leaderboard:", error);
        setUsersError(String(error.message || error));
        setUsers([]);
        setLoadingUsers(false);
        return;
      }
      console.debug('Loaded leaderboard rows:', (data || []).length, data?.slice?.(0,3));
      const mapped: User[] = (data || []).map((row: any, idx: number) => {
        const pts = Number(row.ukupno_poena) || 0;
        return {
          id: row.id,
          name: row.korisnicko_ime || "Korisnik",
          points: pts,
          level: row.nivo || 0,
          badge: badgeForRank(idx + 1),
          rank: idx + 1,
          photoChallenges: 0,
          challengesCompleted: 0,
        };
      });

      // Update badges in DB (best-effort)
      const updates = mapped.map((user) =>
        supabase
          .from("korisnik_profil")
          .update({ trenutni_bedz: user.badge })
          .eq("id", user.id)
      );
      Promise.allSettled(updates).then((results) => {
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length) {
          console.warn("Some badge updates failed:", failures.length);
        }
      });

      setUsers(mapped);
    } catch (e) {
      console.error("Unexpected error loading leaderboard:", e);
      setUsersError(String(e));
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMoreBronze = async () => {
    if (loadingBronze || !bronzeHasMore) return;
    setLoadingBronze(true);
    try {
      const PAGE = 10;
      const { data, error } = await supabase
        .from("korisnik_profil")
        .select("id, korisnicko_ime, ukupno_poena, nivo")
        .order("ukupno_poena", { ascending: false })
        .range(bronzeOffset, bronzeOffset + PAGE - 1);

      if (error) {
        console.error("Error loading bronze users:", error);
        setLoadingBronze(false);
        return;
      }

      const mapped: User[] = (data || []).map((row: any, idx: number) => {
        const pts = Number(row.ukupno_poena) || 0;
        const rank = bronzeOffset + idx + 1;
        return {
          id: row.id,
          name: row.korisnicko_ime || "Korisnik",
          points: pts,
          level: row.nivo || 0,
          badge: badgeForRank(rank),
          rank,
          photoChallenges: 0,
          challengesCompleted: 0,
        };
      });

      if (mapped.length < PAGE) {
        setBronzeHasMore(false);
      }

      if (mapped.length) {
        setBronzeUsers((prev) => [...prev, ...mapped]);
        setBronzeOffset(bronzeOffset + mapped.length);
      }
    } catch (e) {
      console.error("Unexpected error loading bronze users:", e);
    } finally {
      setLoadingBronze(false);
    }
  };

  
  const loadActivities = async () => {
    setLoadingActivities(true);
    setActivitiesError(null);
    try {
      const tryOrder = async (col: string) =>
        supabase
          .from("aktivnosti")
          .select("id, opis, poena_dodato, kategorija, status")
          .order(col, { ascending: false })
          .limit(6);

      let result = await tryOrder("kreirano_u");

      if (result.error) {
        if (result.error.code === "42703" || /does not exist/i.test(String(result.error.message))) {
          console.warn("aktivnosti.kreirano_u missing, trying created_at");
          result = await tryOrder("created_at");
        }
      }

      if (result.error) {
        if (result.error.code === "42703" || /does not exist/i.test(String(result.error.message))) {
          console.warn("aktivnosti.created_at missing, falling back to id");
          const retry = await tryOrder("id");
          if (retry.error) {
            console.error("Error fetching activities (retry by id):", retry.error);
            setActivitiesError(String(retry.error.message || retry.error));
            setActivities([]);
            setLoadingActivities(false);
            return;
          }
          console.debug("Fetched activities (retry by id):", retry.data?.length || 0);
          setActivities(retry.data || []);
          setLoadingActivities(false);
          return;
        }

        console.error("Error fetching activities:", result.error);
        setActivitiesError(String(result.error.message || result.error));
        setActivities([]);
        setLoadingActivities(false);
        return;
      }

      console.debug("Fetched activities:", result.data?.length || 0);
      setActivities(result.data || []);
    } catch (e) {
      console.error("Unexpected error fetching activities:", e);
      setActivitiesError(String(e));
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    loadActivities();
  }, []);

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

 
  const topThreeUsers = users.filter((user) => user.rank <= 3);

  
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
              {
                // Defensive rendering: users may be empty while loading.
                // Pick first/second/third if available, otherwise render placeholders.
              }
              {(() => {
                const first = users[0];
                const second = users[1];
                const third = users[2];

                return (
                  <>
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
                        {(second?.name ?? "Korisnik")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <p className="community-podium-name">
                        {(second?.name ?? "Korisnik").split(" ")[0]}
                      </p>
                      <p className="community-podium-points">{second?.points ?? "—"} pts</p>
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
                        {(first?.name ?? "Korisnik")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <p className="community-podium-name">
                        {(first?.name ?? "Korisnik").split(" ")[0]}
                      </p>
                      <p className="community-podium-points">{first?.points ?? "—"} pts</p>
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
                        {(third?.name ?? "Korisnik")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <p className="community-podium-name">
                        {(third?.name ?? "Korisnik").split(" ")[0]}
                      </p>
                      <p className="community-podium-points">{third?.points ?? "—"} pts</p>
                    </motion.div>
                  </>
                );
              })()}
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
              } community-badge-${user.badge}`}
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
                      {levelLabelFromPoints(user.points)}
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

          {activeFilter === "bronze" && bronzeHasMore && (
            <div className="community-load-more">
              <button
                className="community-reset-btn"
                onClick={loadMoreBronze}
                disabled={loadingBronze}
              >
                {loadingBronze ? "Učitavanje..." : "Prikaži više"}
              </button>
            </div>
          )}

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
