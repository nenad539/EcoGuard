import React, { useEffect, useMemo, useState, useContext } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  Search,
  Users,
  MessageCircle,
  Filter,
  Star,
  Flame,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../supabase-client";
import { NavigationContext } from "../App";
import "../styles/FriendSystemScreen.css";

type Friend = {
  id: string;
  connectionId?: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  status: "online" | "offline" | "away";
  relation: "accepted" | "pending-in" | "pending-out" | "suggested";
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

export function FriendSystemScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [activeTab, setActiveTab] = useState<"friends" | "groups">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [suggestedList, setSuggestedList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState({
    allGroups: [],
    reportsCount: 0,
    largestGroupSize: 0,
    dailyConnections: 0,
    avgFriendsPerUser: 0,
  });

  // static groups (unchanged)
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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      const uid = await getUserId();
      if (!uid) {
        setLoading(false);
        return;
      }
      setUserId(uid);
      await checkAdminStatus(uid);
      await loadFriends(uid);
      await loadSuggestions(uid);
      setLoading(false);
    };
    init();
  }, []);

  const checkAdminStatus = async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from("korisnik_profil")
        .select("is_admin, role")
        .eq("id", uid)
        .single();

      if (profile?.is_admin || profile?.role === "admin") {
        setUserIsAdmin(true);
        await loadAdminData();
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const loadAdminData = async () => {
    try {
      // Fetch all groups from database if they exist
      const { data: dbGroups } = await supabase
        .from("grupe")
        .select("*")
        .limit(10);

      // Fetch reports count
      const { count: reportsCount } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Calculate social stats
      const { data: allUsers } = await supabase
        .from("korisnik_profil")
        .select("id");

      const { data: allConnections } = await supabase
        .from("prijatelji")
        .select("*")
        .eq("status", "accepted");

      const avgFriends = allConnections
        ? allConnections.length / (allUsers?.length || 1)
        : 0;

      // Find largest group
      const largestGroup = groups.reduce(
        (max, group) => (group.members > max.members ? group : max),
        { members: 0 }
      );

      setAdminData({
        allGroups: dbGroups || groups,
        reportsCount: reportsCount || 0,
        largestGroupSize: largestGroup.members,
        dailyConnections: Math.floor(Math.random() * 50) + 20, // Mock data
        avgFriendsPerUser: parseFloat(avgFriends.toFixed(1)),
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  const getUserId = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error (friends):", error);
        return null;
      }
      return data.user?.id ?? null;
    } catch (e) {
      console.error("Unexpected auth error (friends):", e);
      return null;
    }
  };

  const mapProfileToFriend = (
    row: any,
    relation: Friend["relation"],
    rank: number,
    connectionId?: string
  ): Friend => {
    const initials =
      (row.korisnicko_ime || "Korisnik")
        .split(" ")
        .map((n: string) => n[0])
        .join("") || "K";
    return {
      id: row.id,
      connectionId,
      name: row.korisnicko_ime || "Korisnik",
      avatar: initials,
      level: row.nivo || 0,
      points: Number(row.ukupno_poena) || 0,
      status: "online",
      relation,
      rank,
      city: row.grad || "—",
      badge: (row.trenutni_bedz as any) || "bronze",
      streak: row.dnevna_serija || 0,
    };
  };

  const loadFriends = async (uid: string) => {
    try {
      const { data: connections, error: connErr } = await supabase
        .from("prijatelji")
        .select("id, korisnik_od, korisnik_do, status")
        .or(`korisnik_od.eq.${uid},korisnik_do.eq.${uid}`)
        .in("status", ["pending", "accepted"]);

      if (connErr) {
        console.error("Error loading friends:", connErr);
        setError("Greška pri učitavanju prijatelja.");
        return;
      }

      const friendIds = (connections || []).map((c: any) =>
        c.korisnik_od === uid ? c.korisnik_do : c.korisnik_od
      );

      if (!friendIds.length) {
        setFriendList([]);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from("korisnik_profil")
        .select(
          "id, korisnicko_ime, ukupno_poena, nivo, trenutni_bedz, dnevna_serija"
        )
        .in("id", friendIds)
        .order("ukupno_poena", { ascending: false });

      if (profErr) {
        console.error("Error loading friend profiles:", profErr);
        setError("Greška pri učitavanju profila prijatelja.");
      }

      const mappedProfiles = (profiles || []).map((row: any, idx: number) => {
        const conn = (connections || []).find(
          (c: any) =>
            (c.korisnik_od === uid ? c.korisnik_do : c.korisnik_od) === row.id
        );
        const relation =
          conn?.status === "accepted"
            ? "accepted"
            : conn?.korisnik_do === uid
            ? "pending-in"
            : "pending-out";
        return mapProfileToFriend(row, relation, idx + 1, conn?.id);
      });

      const missing = (connections || []).filter(
        (c: any) =>
          !(profiles || []).some(
            (p: any) =>
              p.id === (c.korisnik_od === uid ? c.korisnik_do : c.korisnik_od)
          )
      );
      const fallbackMapped = missing.map((c: any, idx: number) => {
        const otherId = c.korisnik_od === uid ? c.korisnik_do : c.korisnik_od;
        const relation =
          c.status === "accepted"
            ? "accepted"
            : c.korisnik_do === uid
            ? "pending-in"
            : "pending-out";
        return mapProfileToFriend(
          {
            id: otherId,
            korisnicko_ime: "Korisnik",
            ukupno_poena: 0,
            nivo: 0,
            trenutni_bedz: "bronze",
            dnevna_serija: 0,
          },
          relation,
          friendIds.length + idx + 1,
          c.id
        );
      });

      setFriendList([...mappedProfiles, ...fallbackMapped]);
    } catch (e) {
      console.error("Unexpected error loading friends:", e);
      setError("Neočekivana greška pri učitavanju prijatelja.");
    }
  };

  const loadSuggestions = async (uid: string) => {
    try {
      const existingIds = new Set<string>([
        uid,
        ...friendList.map((f) => f.id),
      ]);
      const { data: profiles, error } = await supabase
        .from("korisnik_profil")
        .select(
          "id, korisnicko_ime, ukupno_poena, nivo, trenutni_bedz, dnevna_serija"
        )
        .limit(30);

      if (error) {
        console.error("Error loading suggestions:", error);
        return;
      }

      const shuffled = (profiles || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

      const mapped = shuffled
        .filter((p) => !existingIds.has(p.id))
        .map((row: any, idx: number) =>
          mapProfileToFriend(row, "suggested", idx + 1)
        );

      const merged = mapped.map((m) => {
        const existing = friendList.find((f) => f.id === m.id);
        if (existing && existing.relation === "pending-out") {
          return {
            ...m,
            relation: "pending-out",
            connectionId: existing.connectionId,
          };
        }
        return m;
      });

      setSuggestedList(merged);
    } catch (e) {
      console.error("Unexpected error loading suggestions:", e);
    }
  };

  const logActivity = async (user: string, opis: string, status: string) => {
    try {
      await supabase.from("aktivnosti").insert({
        korisnik_id: user,
        opis,
        poena_dodato: 0,
        kategorija: "friends",
        status,
        kreirano_u: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to log activity (friends):", e);
    }
  };

  const handleAddFriend = async (friendId: string, name: string) => {
    if (!userId) return;
    try {
      const { data: existing, error: existingErr } = await supabase
        .from("prijatelji")
        .select("id, status, korisnik_od, korisnik_do")
        .or(
          `and(korisnik_od.eq.${userId},korisnik_do.eq.${friendId}),and(korisnik_od.eq.${friendId},korisnik_do.eq.${userId})`
        )
        .maybeSingle();

      if (existingErr && existingErr.code !== "PGRST116") {
        console.error("Check existing friend error:", existingErr);
      }

      if (existing) {
        await loadFriends(userId);
        setSuggestedList((prev) =>
          prev.map((f) =>
            f.id === friendId
              ? {
                  ...f,
                  relation:
                    existing.status === "accepted"
                      ? "accepted"
                      : existing.korisnik_do === userId
                      ? "pending-in"
                      : "pending-out",
                }
              : f
          )
        );
        return;
      }

      const { error } = await supabase.from("prijatelji").insert({
        korisnik_od: userId,
        korisnik_do: friendId,
        status: "pending",
        kreirano_u: new Date().toISOString(),
      });
      if (error) {
        console.error("Add friend error:", error);
        setError("Greška pri slanju zahtjeva.");
        return;
      }

      setSuggestedList((prev) =>
        prev.map((friend) =>
          friend.id === friendId
            ? { ...friend, relation: "pending-out" }
            : friend
        )
      );

      await loadFriends(userId);

      await logActivity(
        userId,
        `Poslat zahtjev za prijateljstvo: ${name}`,
        "pending"
      );
      await logActivity(
        friendId,
        `Novi zahtjev za prijateljstvo od korisnika`,
        "pending"
      );
    } catch (e) {
      console.error("Unexpected add friend error:", e);
    }
  };

  const handleAcceptFriend = async (friend: Friend) => {
    if (!userId || !friend.connectionId) return;
    try {
      const { error } = await supabase
        .from("prijatelji")
        .update({ status: "accepted" })
        .eq("id", friend.connectionId);
      if (error) {
        console.error("Accept friend error:", error);
        setError("Greška pri prihvatanju.");
        return;
      }
      await loadFriends(userId);
      await logActivity(
        userId,
        `Prihvaćen zahtjev od ${friend.name}`,
        "accepted"
      );
      await logActivity(friend.id, `Vaš zahtjev je prihvaćen`, "accepted");
    } catch (e) {
      console.error("Unexpected accept friend error:", e);
    }
  };

  // DODAJ OVE FUNKCIJE ZA CHAT:
  const handleOpenChat = (friend: Friend) => {
    // Sačuvaj podatke o chatu u localStorage
    localStorage.setItem(
      "currentChat",
      JSON.stringify({
        name: friend.name,
        avatar: friend.avatar,
        type: "private",
        status: friend.status,
        level: friend.level,
        points: friend.points,
        city: friend.city,
        id: friend.id,
      })
    );

    // Navigate to chat screen
    navigateTo("chat");
  };

  const handleOpenGroupChat = (group: Group) => {
    // Sačuvaj podatke o grupi u localStorage
    localStorage.setItem(
      "currentChat",
      JSON.stringify({
        name: group.name,
        avatar: group.name.charAt(0), // Prvo slovo imena grupe
        type: "group",
        members: group.members,
        category: group.category,
        description: group.description,
        ecoPoints: group.ecoPoints,
        id: group.id,
        isJoined: group.isJoined,
      })
    );

    // Navigate to chat screen
    navigateTo("chat");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#22c55e";
      case "away":
        return "#f59e0b";
      case "offline":
        return "#6b7280";
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

  const achievementTitleFromPoints = (pts: number) => {
    if (pts >= 5000) return "Legenda prirode";
    if (pts >= 2500) return "Eko heroj";
    if (pts >= 1000) return "Eko borac";
    if (pts >= 500) return "Aktivan član";
    if (pts >= 100) return "Početnik";
    return "Rookie";
  };

  const filteredFriends = useMemo(
    () =>
      friendList.filter(
        (friend) =>
          (friend.relation === "accepted" ||
            friend.relation === "pending-in" ||
            friend.relation === "pending-out") &&
          (friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            friend.city.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [friendList, searchQuery]
  );

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Admin functions
  const scanForSpam = async () => {
    alert("Scanning for spam messages...");
  };

  const viewReports = async () => {
    alert(`Showing ${adminData.reportsCount} reports`);
  };

  const manageBlockedUsers = async () => {
    alert("Opening blocked users management...");
  };

  const exportFriendData = async () => {
    alert("Exporting friend network data...");
  };

  const viewGroupMembers = (groupId: number) => {
    alert(`Viewing members of group ${groupId}`);
  };

  const messageGroup = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      handleOpenGroupChat(group);
    }
  };

  const moderateGroup = (groupId: number) => {
    alert(`Moderating group ${groupId}`);
  };

  return (
    <div className="friend-system-screen">
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

        <div className="friend-tabs">
          <button
            onClick={() => setActiveTab("friends")}
            className={`friend-tab ${activeTab === "friends" ? "active" : ""}`}
          >
            <Users className="friend-tab-icon" />
            <span>Prijatelji</span>
            <span className="tab-count">{filteredFriends.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`friend-tab ${activeTab === "groups" ? "active" : ""}`}
          >
            <Users className="friend-tab-icon" />
            <span>Grupe</span>
            <span className="tab-count">{groups.length}</span>
          </button>
        </div>
      </div>

      {loading && <p className="friend-loading">Učitavanje...</p>}
      {error && <div className="fetch-error">{error}</div>}

      <div className="friend-content">
        {activeTab === "friends" && (
          <div className="friends-container">
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
                            {achievementTitleFromPoints(friend.points)}
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
                      {friend.relation === "accepted" && (
                        <button
                          className="friend-action-btn message-btn"
                          onClick={() => handleOpenChat(friend)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Poruka</span>
                        </button>
                      )}
                      {friend.relation === "pending-in" && (
                        <button
                          className="friend-action-btn add-btn"
                          onClick={() => handleAcceptFriend(friend)}
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Prihvati</span>
                        </button>
                      )}
                      {friend.relation === "pending-out" && (
                        <button
                          className="friend-action-btn added-btn"
                          disabled
                        >
                          <span>Na čekanju</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

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
                            {achievementTitleFromPoints(friend.points)}
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
                      {friend.relation === "pending-out" ? (
                        <button
                          className="friend-action-btn added-btn"
                          disabled
                        >
                          <span>Na čekanju</span>
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleAddFriend(friend.id, friend.name)
                          }
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
                    onClick={() => handleOpenGroupChat(group)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="group-card-header">
                      <div className="group-info">
                        <h4 className="group-name">{group.name}</h4>
                        <p className="group-description">{group.description}</p>
                      </div>
                      <ChevronRight className="group-arrow" />
                    </div>
                    <div className="group-meta">
                      <span className="group-members">
                        {group.members} članova
                      </span>
                      <span className="group-category">{group.category}</span>
                    </div>
                    <div className="group-stats">
                      <div className="group-stat">
                        <Star className="group-stat-icon" />
                        <span>{group.ecoPoints} eko poena</span>
                      </div>
                    </div>
                    <div className="group-actions">
                      <button className="group-action-btn primary">
                        {group.isJoined ? "Pridružen" : "Pridruži se"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN PANEL */}
      {userIsAdmin && (
        <div className="admin-panel">
          <h3 className="admin-title">👑 Admin: Prijatelji & Grupe</h3>

          <div className="admin-section">
            <h4>👥 Grupna Administracija</h4>

            <div className="admin-groups">
              {adminData.allGroups.slice(0, 3).map((group: any) => (
                <div key={group.id} className="admin-group-card">
                  <h5>
                    {group.name} ({group.members || 0} članova)
                  </h5>
                  <p>{group.description || "Nema opisa"}</p>
                  <div className="group-actions">
                    <button
                      className="small-btn"
                      onClick={() => viewGroupMembers(group.id)}
                    >
                      👁️ Članovi
                    </button>
                    <button
                      className="small-btn"
                      onClick={() => messageGroup(group.id)}
                    >
                      💬 Poruka grupi
                    </button>
                    {group.hasIssues && (
                      <button
                        className="small-btn warning"
                        onClick={() => moderateGroup(group.id)}
                      >
                        ⚠️ Moderiraj
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h4>🛡️ Moderation Tools</h4>
            <div className="admin-grid">
              <button className="admin-btn" onClick={scanForSpam}>
                🔍 Scan za spam
              </button>
              <button className="admin-btn" onClick={viewReports}>
                ⚠️ Prijave ({adminData.reportsCount})
              </button>
              <button className="admin-btn" onClick={manageBlockedUsers}>
                🚫 Blokirani korisnici
              </button>
              <button className="admin-btn" onClick={exportFriendData}>
                📊 Export mreže
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h4>📊 Social Analytics</h4>
            <div className="social-stats">
              <div className="social-stat">
                <span>Prosječno prijatelja:</span>
                <strong>{adminData.avgFriendsPerUser}</strong>
              </div>
              <div className="social-stat">
                <span>Najveća grupa:</span>
                <strong>{adminData.largestGroupSize} članova</strong>
              </div>
              <div className="social-stat">
                <span>Dnevne veze:</span>
                <strong>{adminData.dailyConnections}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
