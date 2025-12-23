import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  Camera,
  Plus,
  Trophy,
  Users,
  MapPin,
  CheckCircle2,
  Recycle,
  TreePine,
  Droplet,
  Clock,
} from "lucide-react";
import { PhotoSubmission } from "../components/PhotoSubmission";
import { supabase } from "../supabase-client";
import "../styles/PhotoChallengeScreen.css";

type PhotoChallenge = {
  id: number;
  title: string;
  description: string;
  points: number;
  location: string;
  author: string;
  completions: number;
  difficulty: "easy" | "medium" | "hard";
  category: "cleanup" | "recycling" | "nature" | "awareness";
  image?: string;
  status: "available" | "completed" | "pending";
  timeLimit?: string;
  createdAt: string;
};


type RegularChallenge = {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  points: number;
  icon: React.ElementType;
  status: "active" | "completed" | "available";
  gradient: string;
};

interface PhotoChallengeScreenProps {
  navigateToCreate?: () => void;
}

const REGULAR_COMPLETION_TABLE_CANDIDATES = [
  import.meta.env.VITE_REGULAR_COMPLETION_TABLE,
  'regular_challenge_completions',
  'regularChallengeCompletion',
  'user_regular_challenges'
].filter(Boolean) as string[];

const PHOTO_COMPLETION_TABLE = 'photo_challenge_completions';
const PHOTO_COMPLETION_ID_FIELDS = ['challenge_id', 'photo_challenge_id', 'photoId', 'photo_challenge'];

const iconMap: Record<string, React.ElementType> = {
  recycle: Recycle,
  tree: TreePine,
  droplet: Droplet,
  default: Recycle,
};



export function PhotoChallengeScreen({
  navigateToCreate,
}: PhotoChallengeScreenProps) {
  const [activeTab, setActiveTab] = useState<"regular" | "photo">("regular");
  const [userId, setUserId] = useState<string | null>(null);
  const [regularCompletionTable, setRegularCompletionTable] = useState<string | null>(null);
  const resolvingTable = useRef<boolean>(false);
  const [regularCompletionMap, setRegularCompletionMap] = useState<
    Record<number, { challenge_id: number; completed_at: string }>
  >({});
  const [regularLoading, setRegularLoading] = useState(false);
  const [regularError, setRegularError] = useState<string | null>(null);
  const [regularChallengesDb, setRegularChallengesDb] = useState<RegularChallenge[]>([]);
  const [regularCompletedIds, setRegularCompletedIds] = useState<number[]>([]);
  const [photoCompletionMap, setPhotoCompletionMap] = useState<
    Record<number, { completionKey: number; completed_at: string }>
  >({});
  const [photoCompletedIds, setPhotoCompletedIds] = useState<number[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoCompletionIdField, setPhotoCompletionIdField] = useState<string>('challenge_id');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] =
    useState<PhotoChallenge | null>(null);
  const [photoChallenges, setPhotoChallenges] = useState<PhotoChallenge[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const REGULAR_CHALLENGES_PER_PAGE = 5;

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.warn("auth.getUser error (regular challenges):", authError.message || authError);
        }
        const currentUserId = authData?.user?.id;
        if (mounted && currentUserId) {
          setUserId(currentUserId);
          return;
        }
      } catch (e) {
        console.warn("auth.getUser threw (regular challenges):", e);
      }

      try {
        const { data: idData, error: idError } = await supabase
          .from("korisnik_profil")
          .select("id")
          .limit(1);
        if (idError) {
          console.error("Error fetching fallback user id (regular challenges):", idError);
          return;
        }
        if (mounted && idData?.[0]?.id) {
          setUserId(idData[0].id);
        }
      } catch (e) {
        console.error("Unexpected error fetching fallback id (regular challenges):", e);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  const resolveRegularCompletionTable = async (): Promise<string | null> => {
    if (regularCompletionTable) return regularCompletionTable;
    if (resolvingTable.current) return null;

    resolvingTable.current = true;
    let table: string | null = null;

    for (const candidate of REGULAR_COMPLETION_TABLE_CANDIDATES) {
      const { error } = await supabase
        .from(candidate as any)
        .select("challenge_id")
        .limit(1);
      if (error?.code === "PGRST205") {
        continue;
      }
      table = candidate;
      break;
    }

    if (table) {
      setRegularCompletionTable(table);
    }
    resolvingTable.current = false;
    return table;
  };

  const awardPoints = async (points: number) => {
    if (!userId) return;

    // Try the shared add_points RPC
    const { error: addPointsError } = await supabase.rpc("add_points", {
      uid: userId,
      pts: points,
    });

    if (!addPointsError) return;

    // Try alternative RPC used previously
    const { error: altRpcError } = await supabase.rpc("add_points_korisnik", {
      pts: points,
    });

    if (!altRpcError) return;

    // Fallback: manual increment of ukupno_poena
    const { data: profile, error: fetchError } = await supabase
      .from("korisnik_profil")
      .select("ukupno_poena")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Failed to read points for fallback update (regular):", fetchError);
      return;
    }

    const currentPoints = profile?.ukupno_poena ?? 0;
    const { error: updateError } = await supabase
      .from("korisnik_profil")
      .update({ ukupno_poena: currentPoints + points })
      .eq("id", userId);

    if (updateError) {
      console.error("Fallback points update failed (regular):", updateError);
    }
  };

  const fetchRegularChallenges = async () => {
    if (!userId) return;
    setRegularLoading(true);
    setRegularError(null);

    const table = await resolveRegularCompletionTable();
    if (!table) {
      setRegularError("Nismo pronašli tabelu za završene izazove (regular).");
      setRegularLoading(false);
      return;
    }

    const { data: ch, error: chErr } = await supabase
      .from("regular_challenges")
      .select("id, title, description, points, icon_key, category")
      .order("id", { ascending: true });

    if (chErr) {
      console.error("Error fetching regular challenges:", chErr);
      setRegularError("Greška pri učitavanju izazova.");
      setRegularLoading(false);
      return;
    }

    const { data: comp, error: compErr } = await supabase
      .from(table as any)
      .select("challenge_id, completed_at")
      .eq("user_id", userId);

    if (compErr) {
      console.error("Error fetching regular completions:", compErr);
      setRegularError("Greška pri učitavanju završenih izazova.");
      setRegularLoading(false);
      return;
    }

    const completedIds = (comp ?? []).map((x) => x.challenge_id);
    setRegularCompletedIds(completedIds);
    setRegularCompletionMap(
      (comp ?? []).reduce<Record<number, { challenge_id: number; completed_at: string }>>(
        (acc, item) => {
          acc[item.challenge_id] = item;
          return acc;
        },
        {}
      )
    );

    const mapped: RegularChallenge[] = (ch ?? []).map((c: any) => {
      const Icon = iconMap[c.icon_key] ?? iconMap.default;
      const isCompleted = completedIds.includes(c.id);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        progress: isCompleted ? 1 : 0,
        total: 1,
        points: c.points,
        icon: Icon,
        status: isCompleted ? "completed" : "available",
        gradient: "from-green-500 to-emerald-600",
      };
    });

    setRegularChallengesDb(mapped);
    setRegularLoading(false);
  };

  const completeRegularChallenge = async (challengeId: number, points: number) => {
    if (!userId) return;
    const table = regularCompletionTable || (await resolveRegularCompletionTable());
    if (!table) {
      setRegularError("Nismo pronašli tabelu za završene izazove (regular).");
      return;
    }

    if (regularCompletedIds.includes(challengeId)) return;

    const payload = {
      user_id: userId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
    };

    const { error: insErr } = await supabase
      .from(table as any)
      .upsert(payload, { onConflict: "user_id,challenge_id" });

    if (insErr) {
      console.error("Error completing regular challenge:", insErr);
      setRegularError("Greška pri završavanju izazova.");
      return;
    }

    setRegularCompletedIds((prev) => [...prev, challengeId]);
    setRegularCompletionMap((prev) => ({
      ...prev,
      [challengeId]: { challenge_id: challengeId, completed_at: payload.completed_at },
    }));
    setRegularChallengesDb((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, status: "completed", progress: 1 } : c
      )
    );

    await awardPoints(points);
  };

  const completePhotoChallenge = async (challengeId: number, points: number) => {
    if (!userId) return;
    if (photoCompletedIds.includes(challengeId)) return;

    // Ensure we have a valid id field; if not, fall back to default
    const idField = photoCompletionIdField || PHOTO_COMPLETION_ID_FIELDS[0] || 'challenge_id';

    const payload = {
      user_id: userId,
      [idField]: challengeId,
      completed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(PHOTO_COMPLETION_TABLE)
      .upsert(payload, { onConflict: "user_id,challenge_id" });

    if (error) {
      console.error("Error completing photo challenge:", error);
      setPhotoError("Greška pri završavanju foto izazova.");
      return;
    }

    setPhotoCompletedIds((prev) => [...prev, challengeId]);
    setPhotoCompletionMap((prev) => ({
      ...prev,
      [challengeId]: { completionKey: challengeId, completed_at: payload.completed_at },
    }));
    setPhotoChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, status: "completed" as const } : c
      )
    );

    await awardPoints(points);
  };

  useEffect(() => {
    if (activeTab === "regular") {
      fetchRegularChallenges();
    }
  }, [activeTab, userId]);


  useEffect(() => {
    if (activeTab === "photo" && userId) {
      fetchPhotoChallenges();
    }
  }, [activeTab, userId]);

  const fetchPhotoChallenges = async () => {
    if (!userId) return;
    setPhotoLoading(true);
    setPhotoError(null);

    let { data, error } = await supabase
      .from("photoChallenge")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching photo challenges:", error);
      setPhotoError("Greška pri učitavanju foto izazova.");
      setPhotoLoading(false);
      return;
    }

    let comp: any[] | null = null;
    let compErr = null;

    for (const field of PHOTO_COMPLETION_ID_FIELDS) {
      const { data: tryData, error: tryErr } = await supabase
        .from(PHOTO_COMPLETION_TABLE)
        .select(`${field}, completed_at`)
        .eq("user_id", userId);

      if (tryErr?.code === "42703") {
        // column not found, try next candidate
        continue;
      }

      comp = tryData ?? [];
      compErr = tryErr;
      setPhotoCompletionIdField(field);
      break;
    }

    if (compErr) {
      console.error("Error fetching photo completions:", compErr);
      setPhotoError("Greška pri učitavanju završenih foto izazova.");
      setPhotoLoading(false);
      return;
    }

    const completedIds = (comp ?? []).map((c: any) => c[photoCompletionIdField]).filter(Boolean);
    setPhotoCompletedIds(completedIds);
    setPhotoCompletionMap(
      (comp ?? []).reduce<Record<number, { completionKey: number; completed_at: string }>>(
        (acc, item) => {
          const key = item[photoCompletionIdField];
          if (!key) return acc;
          acc[key] = { completionKey: key, completed_at: item.completed_at };
          return acc;
        },
        {}
      )
    );

    const mapped = (data ?? []).map((c: any) => ({
      ...c,
      status: completedIds.includes(c.id) ? "completed" : ("available" as const),
    }));

    setPhotoChallenges(mapped);
    setCurrentPage(0);
    setPhotoLoading(false);
  };

  const handlePhotoSubmission = (challenge: PhotoChallenge) => {
    setSelectedChallenge(challenge);
    setShowSubmissionModal(true);
  };

  const handleSubmissionComplete = async (submission: any) => {
    setShowSubmissionModal(false);
    const challenge = selectedChallenge;
    setSelectedChallenge(null);
    console.log("Photo submission completed:", submission);
    if (challenge) {
      await completePhotoChallenge(challenge.id, challenge.points);
    }
  };

  const handleSubmissionCancel = () => {
    setShowSubmissionModal(false);
    setSelectedChallenge(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Laki";
      case "medium":
        return "Srednji";
      case "hard":
        return "Teški";
      default:
        return "Laki";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cleanup":
        return Camera;
      case "recycling":
        return Recycle;
      case "nature":
        return TreePine;
      case "awareness":
        return Users;
      default:
        return Camera;
    }
  };

  const paginatedPhotoChallenges = () => {
    const start = currentPage * REGULAR_CHALLENGES_PER_PAGE;
    const end = start + REGULAR_CHALLENGES_PER_PAGE;
    return photoChallenges.slice(start, end);
  };

  const nextPage = () => {
    if (
      (currentPage + 1) * REGULAR_CHALLENGES_PER_PAGE <
      photoChallenges.length
    ) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="photo-challenge-screen">
      {/* Header */}
      <div className="photo-challenge-header">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="photo-challenge-title"
        >
          Izazovi
        </motion.h1>
        <p className="photo-challenge-subtitle">
          Osvoj poene kroz različite aktivnosti
        </p>
      </div>

      {/* Plus button in top right corner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={navigateToCreate}
        className="create-floating-btn"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Tabs - Izmijenjeni nazivi */}
      <div className="photo-challenge-tabs">
        <button
          onClick={() => setActiveTab("regular")}
          className={`photo-challenge-tab ${
            activeTab === "regular" ? "active" : ""
          }`}
        >
          Laki
        </button>
        <button
          onClick={() => setActiveTab("photo")}
          className={`photo-challenge-tab ${
            activeTab === "photo" ? "active" : ""
          }`}
        >
          Teški
        </button>
      </div>

      {/* Content */}
      <div className="photo-challenge-content">
        {/* Laki Izazovi Tab */}
        {activeTab === "regular" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="regular-challenges"
          >
            {regularLoading && <p>Učitavanje...</p>}
            {regularError && <div className="fetch-error">{regularError}</div>}

            {regularChallengesDb.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`regular-challenge-card ${
                  challenge.status === "completed" ? "completed" : ""
                }`}
              >
                <div className="regular-challenge-icon">
                  <challenge.icon className="icon" />
                </div>

                <div className="regular-challenge-info">
                  <h3 className="regular-challenge-title">{challenge.title}</h3>
                  <p className="regular-challenge-description">
                    {challenge.description}
                  </p>

                  <div className="regular-challenge-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.round(
                            (challenge.progress / challenge.total) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {challenge.progress}/{challenge.total}
                    </span>
                  </div>
                </div>

                <div className="regular-challenge-reward">
                  <span className="points">{challenge.points}</span>
                  <span className="points-label">pts</span>
                  {challenge.status === 'completed' ? (
  <CheckCircle2 className="completed-icon" />
) : (
  <button
    className="complete-regular-btn"
    onClick={() => completeRegularChallenge(challenge.id, challenge.points)}
  >
    Završi
  </button>
)}

                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Teški Izazovi Tab */}
        {activeTab === "photo" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="photo-challenges"
          >
            {photoLoading && <p>Učitavanje...</p>}
            {photoError && <div className="fetch-error">{photoError}</div>}

            <div className="photo-challenges-navigation">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="nav-arrow"
              >
                &lt;
              </button>
              <button
                onClick={nextPage}
                disabled={
                  (currentPage + 1) * REGULAR_CHALLENGES_PER_PAGE >=
                  photoChallenges.length
                }
                className="nav-arrow"
              >
                &gt;
              </button>
            </div>
            {paginatedPhotoChallenges().map((challenge, index) => {
              const CategoryIcon = getCategoryIcon(challenge.category);
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`photo-challenge-card ${challenge.status}`}
                >
                  <div className="photo-challenge-card-header">
                    <div className="photo-challenge-card-icon">
                      <CategoryIcon className="icon" />
                    </div>
                    <div className="photo-challenge-card-meta">
                      <span
                        className={`difficulty ${getDifficultyColor(
                          challenge.difficulty
                        )}`}
                      >
                        {getDifficultyText(challenge.difficulty)}
                      </span>
                      <span className="points">{challenge.points} pts</span>
                    </div>
                  </div>

                  <h3 className="photo-challenge-card-title">
                    {challenge.title}
                  </h3>
                  <p className="photo-challenge-card-description">
                    {challenge.description}
                  </p>

                  <div className="photo-challenge-card-details">
                    <div className="detail">
                      <MapPin className="detail-icon" />
                      <span>{challenge.location}</span>
                    </div>
                    <div className="detail">
                      <Users className="detail-icon" />
                      <span>{challenge.completions} završeno</span>
                    </div>
                    {challenge.timeLimit && (
                      <div className="detail">
                        <Clock className="detail-icon" />
                        <span>{challenge.timeLimit}</span>
                      </div>
                    )}
                  </div>

                  <div className="photo-challenge-card-footer">
                    <span className="author">by {challenge.author}</span>
                    {challenge.status === "completed" ? (
                      <span className="status-completed">
                        <CheckCircle2 className="status-icon" />
                        Završeno
                      </span>
                    ) : (
                      <button
                        className="accept-challenge-btn"
                        onClick={() => handlePhotoSubmission(challenge)}
                      >
                        <Camera className="btn-icon" />
                        Prihvati
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Photo Submission Modal */}
      {showSubmissionModal && selectedChallenge && (
        <PhotoSubmission
          challengeId={selectedChallenge.id}
          challengeTitle={selectedChallenge.title}
          challengePoints={selectedChallenge.points}
          onSubmit={handleSubmissionComplete}
          onCancel={handleSubmissionCancel}
        />
      )}

      <BottomNav />
    </div>
  );
}
