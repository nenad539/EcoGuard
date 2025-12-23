import React, { useContext, useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { motion } from "motion/react";
import { NavigationContext } from "../App";
import { BottomNav } from "../components/common/BottomNav";
import { Recycle, Star, Bell, Flame } from "lucide-react";
import "../styles/HomeScreen.css";

export function HomeScreen() {
  const { userData, navigateTo } = useContext(NavigationContext);

  const ACTIVITY_TABLE = "aktivnosti";

  const [userName, setUserName] = useState("");
  const [userLevel, setUserLevel] = useState("");
  const [userReciklirano, setUserReciklirano] = useState("");
  const [userPoints, setUserPoints] = useState("");
  const [userStreak, setUserStreak] = useState("7");
  const [activities, setActivities] = useState<
    {
      id: string;
      opis: string;
      poena_dodato: number | null;
      kategorija: string | null;
      status: string | null;
      kreirano_u: string | null;
    }[]
  >([]);

  const getUserName = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from("korisnik_profil")
      .select("korisnicko_ime");

    if (error) {
      console.error("Error fetching user:", error);
      return "Korisnik";
    }

    return korisnik_profil?.[0]?.korisnicko_ime || "Korisnik";
  };

  const updateAndGetStreak = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return 0;

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("korisnik_profil")
      .select("dnevna_serija, posljednji_login")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Streak fetch error:", error);
      return 0;
    }

    let newStreak = data.dnevna_serija ?? 0;

    if (!data.posljednji_login) {
      newStreak = 1;
    } else {
      const lastLogin = new Date(data.posljednji_login);
      const diffDays =
        (today.setHours(0, 0, 0, 0) - lastLogin.setHours(0, 0, 0, 0)) /
        86400000;

      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    }

    await supabase
      .from("korisnik_profil")
      .update({
        dnevna_serija: newStreak,
        posljednji_login: todayDate,
      })
      .eq("id", userId);

    return newStreak;
  };

  const getUserLevel = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from("korisnik_profil")
      .select("nivo");

    if (error) {
      console.error("Error fetching user:", error);
      return "0";
    }

    return korisnik_profil?.[0]?.nivo || "Korisnik";
  };

  const getUserReciklirano = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from("korisnik_profil")
      .select("reciklirano_stvari");

    if (error) {
      console.error("Error fetching user:", error);
      return "0";
    }

    return korisnik_profil?.[0]?.reciklirano_stvari || "0";
  };

  const getUserPoints = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from("korisnik_profil")
      .select("ukupno_poena");

    if (error) {
      console.error("Error fetching user:", error);
      return "0";
    }

    return korisnik_profil?.[0]?.ukupno_poena || "0";
  };

  const getCurrentUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Auth error:", error);
      return null;
    }
    return data.user?.id;
  };

  useEffect(() => {
    updateAndGetStreak().then((streak) => {
      setUserStreak(String(streak));
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("korisnik_profil")
        .select("korisnicko_ime, nivo, reciklirano_stvari, ukupno_poena")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setUserName(data.korisnicko_ime);
      setUserLevel(data.nivo);
      setUserReciklirano(data.reciklirano_stvari);
      setUserPoints(data.ukupno_poena);
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from(ACTIVITY_TABLE)
        .select("id, opis, poena_dodato, kategorija, status, kreirano_u")
        .eq("korisnik_id", userId)
        .order("kreirano_u", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      setActivities(data ?? []);
    };

    loadActivities();
  }, []);

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div className="home-user-info">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="home-welcome"
            >
              Dobro došao nazad, {userName}
            </motion.h1>
            <p className="home-level">Eco Čuvar Lv.{userLevel}</p>
          </div>
          <div className="home-nav-buttons">
            <button
              onClick={() => navigateTo("notifications")}
              className="home-nav-button"
              aria-label="Obavještenja"
            >
              <Bell />
            </button>
            <button
              onClick={() => navigateTo("friends")} // OVO JE PROMIJENJENO - SADA IDE NA FRIENDS
              className="home-profile-button"
              aria-label="Prijatelji"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
              >
                <path
                  fill="#2bc154"
                  d="M15 4a4 4 0 0 0-4 4a4 4 0 0 0 4 4a4 4 0 0 0 4-4a4 4 0 0 0-4-4m0 1.9a2.1 2.1 0 1 1 0 4.2A2.1 2.1 0 0 1 12.9 8A2.1 2.1 0 0 1 15 5.9M4 7v3H1v2h3v3h2v-3h3v-2H6V7H4m11 6c-2.67 0-8 1.33-8 4v3h16v-3c0-2.67-5.33-4-8-4m0 1.9c2.97 0 6.1 1.46 6.1 2.1v1.1H8.9V17c0-.64 3.1-2.1 6.1-2.1"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Grid - NOVI LAYOUT */}
        <div className="home-stats-grid">
          {/* Prva dva widgeta jedan do drugog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="home-stat-card"
          >
            <div className="stat-card-content">
              <div className="home-stat-icon green">
                <Recycle />
              </div>
              <div className="stat-text-container">
                <p className="home-stat-label">Reciklirano</p>
                <div className="value-unit-container">
                  <p className="home-stat-value">
                    {userReciklirano}
                    <span className="home-stat-unit">stvari</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="home-stat-card"
          >
            <div className="stat-card-content">
              <div className="home-stat-icon purple">
                <Star />
              </div>
              <div className="stat-text-container">
                <p className="home-stat-label">Ukupni poeni</p>
                <div className="value-unit-container">
                  <p className="home-stat-value">
                    {userPoints}
                    <span className="home-stat-unit">poena</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Streak widget koji zauzima cijeli red */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="home-streak-card"
          >
            <div className="streak-card-content">
              <div className="home-streak-icon">
                <Flame className="streak-flame" />
                <div className="flame-effect">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
              </div>
              <div className="streak-text-container">
                <p className="home-streak-label">Dnevna serija</p>
                <div className="streak-value-container">
                  <p className="home-streak-value">
                    {userStreak}
                    <span className="home-streak-unit">dana</span>
                  </p>
                </div>
                <div className="streak-info">
                  <span className="streak-badge">🔥 Aktivna serija</span>
                  <p className="streak-subtext">Nastavi tako!</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="cta-container"
        >
          <button
            onClick={() => navigateTo("challenges")}
            className="home-cta-button"
          >
            <Star />
            Dnevni Izazovi
          </button>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="home-section">
        <h2 className="home-section-title">Nedavne aktivnosti</h2>
        <div className="home-activity-list">
          {activities.length === 0 ? (
            <p className="home-activity-empty">Još nema aktivnosti.</p>
          ) : (
            activities.map((activity, index) => {
              const type =
                activity.status === "pending"
                  ? "pending"
                  : activity.kategorija === "photo"
                  ? "photo"
                  : activity.kategorija === "create"
                  ? "create"
                  : "standard";
              const timeText = activity.kreirano_u
                ? new Date(activity.kreirano_u).toLocaleString()
                : "Nedavno";
              return (
                <motion.div
                  key={activity.id ?? index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`home-activity-item ${
                    type === "photo"
                      ? "photo-activity"
                      : type === "pending"
                      ? "pending-activity"
                      : type === "create"
                      ? "create-activity"
                      : ""
                  }`}
                >
                  <div className="activity-text">
                    <p className="home-activity-title">{activity.opis}</p>
                    <p className="home-activity-time">{timeText}</p>
                  </div>
                  <div
                    className={`home-activity-points ${
                      type === "pending" ? "pending-points" : ""
                    }`}
                  >
                    {activity.status === "pending"
                      ? "Na čekanju"
                      : activity.poena_dodato != null
                      ? `+${activity.poena_dodato}`
                      : "+0"}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-section">
        <h2 className="home-section-title">Brze akcije</h2>
        <div className="home-quick-actions">
          <button
            onClick={() => navigateTo("ecoTips")}
            className="home-quick-action"
          >
            <div className="quick-action-content">
              <div className="home-quick-action-emoji">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#2bc154"
                    d="M9.973 18H11v-5h2v5h1.027c.132-1.202.745-2.193 1.74-3.277c.113-.122.832-.867.917-.973a6 6 0 1 0-9.37-.002c.086.107.807.853.918.974c.996 1.084 1.609 2.076 1.741 3.278M10 20v1h4v-1zm-4.246-5a8 8 0 1 1 12.49.002C17.624 15.774 16 17 16 18.5V21a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.5C8 17 6.375 15.774 5.754 15"
                  ></path>
                </svg>
              </div>
              <div className="quick-action-text">
                <p className="home-quick-action-title">Eko savjeti</p>
                <p className="home-quick-action-subtitle">Saznaj više</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigateTo("community")} // OVO JE OSTALO ZAJEDNICA
            className="home-quick-action purple"
          >
            <div className="quick-action-content">
              <div className="home-quick-action-emoji">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
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
              </div>
              <div className="quick-action-text">
                <p className="home-quick-action-title">Zajednica</p>{" "}
                {/* OVO OSTALO ZAJEDNICA */}
                <p className="home-quick-action-subtitle">Rang lista</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
