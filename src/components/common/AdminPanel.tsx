// src/components/AdminPanel.tsx
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "../supabase-client";
import {
  Users,
  Camera,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Unlock,
  Filter,
  Search,
  Download,
  BarChart3,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

interface AdminPanelProps {
  currentScreen?: string;
}

type User = {
  id: string;
  korisnicko_ime: string;
  email: string;
  ukupno_poena: number;
  nivo: number;
  trenutni_bedz: string;
  dnevna_serija: number;
  created_at: string;
};

type PhotoChallenge = {
  id: number;
  photo_challenge_id: number;
  user_id: string;
  image_url: string;
  description: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  completed_at: string;
  points_awarded: boolean;
};

type Group = {
  id: number;
  name: string;
  description: string;
  admin_id: string;
  member_count: number;
  created_at: string;
};

export function AdminPanel({ currentScreen }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "users" | "photos" | "groups" | "analytics"
  >("users");

  // User management
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Photo challenges
  const [photoChallenges, setPhotoChallenges] = useState<PhotoChallenge[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoStatusFilter, setPhotoStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is admin by checking their email or a special role
        const adminEmails = [
          "admin@ecoguard.com",
          "administrator@ecoguard.com",
          "superadmin@ecoguard.com",
        ];

        // Also check if they have admin role in profile
        const { data: profile } = await supabase
          .from("korisnik_profil")
          .select("role")
          .eq("id", user.id)
          .single();

        if (
          adminEmails.includes(user.email?.toLowerCase() || "") ||
          profile?.role === "admin" ||
          profile?.role === "superadmin"
        ) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Load users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("korisnik_profil")
        .select("*")
        .order("ukupno_poena", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load photo challenges
  const loadPhotoChallenges = async () => {
    setPhotosLoading(true);
    try {
      let query = supabase
        .from("photo_challenge_completions")
        .select("*")
        .order("completed_at", { ascending: false });

      if (photoStatusFilter !== "all") {
        query = query.eq("status", photoStatusFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setPhotoChallenges(data || []);
    } catch (error) {
      console.error("Error loading photo challenges:", error);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Load groups
  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const { data, error } = await supabase
        .from("grupe") // Adjust table name as needed
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Handle photo approval
  const handleApprovePhoto = async (
    id: number,
    userId: string,
    challengeId: number
  ) => {
    try {
      // Update status
      const { error } = await supabase
        .from("photo_challenge_completions")
        .update({
          status: "approved",
          points_awarded: true,
        })
        .eq("id", id);

      if (error) throw error;

      // Award points to user
      const { data: challenge } = await supabase
        .from("photoChallenge")
        .select("points")
        .eq("id", challengeId)
        .single();

      if (challenge?.points) {
        await supabase.rpc("add_points", {
          uid: userId,
          pts: challenge.points,
        });
      }

      // Reload
      loadPhotoChallenges();
    } catch (error) {
      console.error("Error approving photo:", error);
    }
  };

  // Handle photo rejection
  const handleRejectPhoto = async (id: number) => {
    try {
      const { error } = await supabase
        .from("photo_challenge_completions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      loadPhotoChallenges();
    } catch (error) {
      console.error("Error rejecting photo:", error);
    }
  };

  // Handle user ban
  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const { error } = await supabase
        .from("korisnik_profil")
        .update({ is_banned: ban })
        .eq("id", userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (isOpen && isAdmin) {
      switch (activeTab) {
        case "users":
          loadUsers();
          break;
        case "photos":
          loadPhotoChallenges();
          break;
        case "groups":
          loadGroups();
          break;
      }
    }
  }, [isOpen, isAdmin, activeTab, photoStatusFilter]);

  if (loading) return null;
  if (!isAdmin) return null;

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.korisnicko_ime?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter photo challenges based on status
  const filteredPhotos = photoChallenges;

  return (
    <>
      {/* Admin Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all duration-300"
        title="Admin Panel"
      >
        <Shield className="w-6 h-6" />
      </motion.button>

      {/* Admin Panel Modal */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-slate-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Admin Panel
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {currentScreen
                        ? `Screen: ${currentScreen}`
                        : "Administration Dashboard"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-400 hover:text-white" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-6">
                {[
                  { id: "users", label: "Korisnici", icon: Users },
                  { id: "photos", label: "Foto Izazovi", icon: Camera },
                  { id: "groups", label: "Grupe", icon: UserCheck },
                  { id: "analytics", label: "Analitika", icon: BarChart3 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Pretraži korisnike po imenu ili emailu..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={loadUsers}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                    >
                      Osveži
                    </button>
                  </div>

                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="mt-2 text-slate-400">
                        Učitavanje korisnika...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-white">
                                {user.korisnicko_ime}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {user.email}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.trenutni_bedz === "gold"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : user.trenutni_bedz === "silver"
                                  ? "bg-slate-500/20 text-slate-300"
                                  : "bg-amber-700/20 text-amber-300"
                              }`}
                            >
                              {user.trenutni_bedz}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                            <div>
                              <p className="text-slate-500">Poeni</p>
                              <p className="text-white font-medium">
                                {user.ukupno_poena}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Serija</p>
                              <p className="text-white font-medium">
                                {user.dnevna_serija} dana
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() =>
                                handleBanUser(user.id, !user.is_banned)
                              }
                              className={`flex-1 py-1 px-3 rounded-lg text-sm transition-colors ${
                                user.is_banned
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
                            >
                              {user.is_banned ? (
                                <>
                                  <Unlock className="inline-block w-3 h-3 mr-1" />
                                  Odblokiraj
                                </>
                              ) : (
                                <>
                                  <Lock className="inline-block w-3 h-3 mr-1" />
                                  Blokiraj
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                /* View user details */
                              }}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "photos" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {(
                        ["all", "pending", "approved", "rejected"] as const
                      ).map((status) => (
                        <button
                          key={status}
                          onClick={() => setPhotoStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg capitalize ${
                            photoStatusFilter === status
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                          }`}
                        >
                          {status === "all"
                            ? "Svi"
                            : status === "pending"
                            ? "Na čekanju"
                            : status === "approved"
                            ? "Odobreni"
                            : "Odbijeni"}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={loadPhotoChallenges}
                      className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                    >
                      Osveži
                    </button>
                  </div>

                  {photosLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="mt-2 text-slate-400">
                        Učitavanje foto izazova...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
                        >
                          <div className="flex gap-4">
                            {photo.image_url && (
                              <div className="w-32 h-32 flex-shrink-0">
                                <img
                                  src={photo.image_url}
                                  alt="Challenge submission"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-white">
                                    Izazov #{photo.photo_challenge_id}
                                  </h3>
                                  <p className="text-sm text-slate-400 mt-1">
                                    {photo.description}
                                  </p>
                                  {photo.location && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      📍 {photo.location}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    photo.status === "approved"
                                      ? "bg-green-500/20 text-green-300"
                                      : photo.status === "rejected"
                                      ? "bg-red-500/20 text-red-300"
                                      : "bg-yellow-500/20 text-yellow-300"
                                  }`}
                                >
                                  {photo.status === "approved"
                                    ? "Odobreno"
                                    : photo.status === "rejected"
                                    ? "Odbijeno"
                                    : "Na čekanju"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-slate-500">
                                  <p>
                                    Korisnik ID: {photo.user_id.substring(0, 8)}
                                    ...
                                  </p>
                                  <p>
                                    Datum:{" "}
                                    {new Date(
                                      photo.completed_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                {photo.status === "pending" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleApprovePhoto(
                                          photo.id,
                                          photo.user_id,
                                          photo.photo_challenge_id
                                        )
                                      }
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Odobri
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectPhoto(photo.id)
                                      }
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Odbij
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "groups" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">
                      Sve Grupe
                    </h3>
                    <button
                      onClick={loadGroups}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                    >
                      Osveži
                    </button>
                  </div>

                  {groupsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="mt-2 text-slate-400">Učitavanje grupa...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
                        >
                          <h3 className="font-medium text-white mb-2">
                            {group.name}
                          </h3>
                          <p className="text-sm text-slate-400 mb-3">
                            {group.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <p className="text-slate-500">Članova</p>
                              <p className="text-white font-medium">
                                {group.member_count}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Kreirana</p>
                              <p className="text-white">
                                {new Date(
                                  group.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400">Ukupno korisnika</p>
                      <p className="text-2xl font-bold text-white">
                        {users.length}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400">Foto izazova</p>
                      <p className="text-2xl font-bold text-white">
                        {photoChallenges.length}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400">Na čekanju</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {
                          photoChallenges.filter((p) => p.status === "pending")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400">Grupa</p>
                      <p className="text-2xl font-bold text-white">
                        {groups.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-medium text-white mb-4">
                      Statistika
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">
                          Najaktivniji korisnici
                        </p>
                        <div className="space-y-2">
                          {users.slice(0, 5).map((user, index) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">
                                  #{index + 1}
                                </span>
                                <span className="text-white">
                                  {user.korisnicko_ime}
                                </span>
                              </div>
                              <span className="text-green-400">
                                {user.ukupno_poena} poena
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Samo za administratore</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                >
                  Zatvori
                </button>
                <button
                  onClick={() => {
                    // Export data
                    alert("Funkcija eksporta u implementaciji...");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Izvezi podatke
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
