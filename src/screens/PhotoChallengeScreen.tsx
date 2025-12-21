import React, { useState, useEffect } from "react";
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

export function PhotoChallengeScreen({
  navigateToCreate,
}: PhotoChallengeScreenProps) {
  const [activeTab, setActiveTab] = useState<"regular" | "photo">("regular");
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] =
    useState<PhotoChallenge | null>(null);
  const [photoChallenges, setPhotoChallenges] = useState<PhotoChallenge[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const REGULAR_CHALLENGES_PER_PAGE = 5;

  const regularChallenges: RegularChallenge[] = [
    {
      id: 1,
      title: "Recikliraj 10 flaša",
      description: "Sakupi i recikliraj 10 plastičnih flaša",
      progress: 7,
      total: 10,
      points: 100,
      icon: Recycle,
      status: "active",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      id: 2,
      title: "Posadi drvo",
      description: "Posadi jedno drvo u svom okruženju",
      progress: 1,
      total: 1,
      points: 200,
      icon: TreePine,
      status: "completed",
      gradient: "from-green-600 to-lime-600",
    },
    {
      id: 3,
      title: "Smanji potrošnju vode",
      description: "Uštedi 50L vode ove sedmice",
      progress: 32,
      total: 50,
      points: 120,
      icon: Droplet,
      status: "active",
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  useEffect(() => {
    if (activeTab === "photo") {
      fetchPhotoChallenges();
    }
  }, [activeTab]);

  const fetchPhotoChallenges = async () => {
    let { data, error } = await supabase
      .from("photoChallenge")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching photo challenges:", error);
      return;
    }

    if (data) {
      const availableData = data.map((c) => ({
        ...c,
        status: "available" as const,
      }));
      setPhotoChallenges(availableData);
      setCurrentPage(0);
    }
  };

  const handlePhotoSubmission = (challenge: PhotoChallenge) => {
    setSelectedChallenge(challenge);
    setShowSubmissionModal(true);
  };

  const handleSubmissionComplete = (submission: any) => {
    setShowSubmissionModal(false);
    setSelectedChallenge(null);
    console.log("Photo submission completed:", submission);
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
            {regularChallenges.map((challenge, index) => (
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
                  {challenge.status === "completed" && (
                    <CheckCircle2 className="completed-icon" />
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
