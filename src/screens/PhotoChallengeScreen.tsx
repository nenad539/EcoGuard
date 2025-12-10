import React, { useState } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  Camera,
  Plus,
  Trophy,
  Users,
  MapPin,
  CheckCircle2,
  Star,
  Award,
  Clock,
  Target,
  Recycle,
  TreePine,
  Droplet,
} from "lucide-react";
import { PhotoSubmission } from "../components/PhotoSubmission";
import { useContext } from "react";
import { NavigationContext } from "../App";
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

export function PhotoChallengeScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [activeTab, setActiveTab] = useState<"regular" | "photo">("regular");
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] =
    useState<PhotoChallenge | null>(null);

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

  const photoChallenges: PhotoChallenge[] = [
    {
      id: 1,
      title: "Očisti gradski park",
      description: "Fotografiši smeće u parku i pokušaj da ga pokupiš",
      points: 150,
      location: "Nikšić, Crna Gora",
      author: "Ana Petrović",
      completions: 12,
      difficulty: "medium",
      category: "cleanup",
      status: "available",
      timeLimit: "7 dana",
      createdAt: "2024-11-01",
    },
    {
      id: 2,
      title: "Razdvojeno bacanje otpada",
      description: "Fotografiši pravilno razvrstan otpad u kontejnerima",
      points: 100,
      location: "Budva, Crna Gora",
      author: "Stefan Ilić",
      completions: 8,
      difficulty: "easy",
      category: "recycling",
      status: "completed",
      createdAt: "2024-10-28",
    },
    {
      id: 3,
      title: "Zeleni kutak u gradu",
      description: "Fotografiši lepo uređen zeleni prostor i podigni svest",
      points: 80,
      location: "Beograd, Srbija",
      author: "Milica Đorđević",
      completions: 15,
      difficulty: "easy",
      category: "nature",
      status: "available",
      timeLimit: "5 dana",
      createdAt: "2024-10-30",
    },
  ];

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

  const getProgressPercentage = (progress: number, total: number) => {
    return Math.round((progress / total) * 100);
  };

  const handlePhotoSubmission = (challenge: PhotoChallenge) => {
    setSelectedChallenge(challenge);
    setShowSubmissionModal(true);
  };

  const handleSubmissionComplete = (submission: any) => {
    setShowSubmissionModal(false);
    setSelectedChallenge(null);
    // Update challenge status or show success message
    console.log("Photo submission completed:", submission);
  };

  const handleSubmissionCancel = () => {
    setShowSubmissionModal(false);
    setSelectedChallenge(null);
  };

  return (
    <div className="photo-challenge-screen">
      {/* Header sa plus dugmetom */}
      <div className="photo-challenge-header">
        <div className="photo-header-content">
          <div className="photo-header-text">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="photo-challenge-title"
            >
              Izazovi{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
              >
                <path
                  fill="#2bc154"
                  d="M7 21v-2h4v-3.1q-1.225-.275-2.187-1.037T7.4 12.95q-1.875-.225-3.137-1.637T3 8V7q0-.825.588-1.412T5 5h2V3h10v2h2q.825 0 1.413.588T21 7v1q0 1.9-1.263 3.313T16.6 12.95q-.45 1.15-1.412 1.913T13 15.9V19h4v2zm0-10.2V7H5v1q0 .95.55 1.713T7 10.8m10 0q.9-.325 1.45-1.088T19 8V7h-2z"
                ></path>
              </svg>
            </motion.h1>
            <p className="photo-challenge-subtitle">
              Osvoj poene kroz različite aktivnosti
            </p>
          </div>

          {/* Plus dugme gore desno */}
          <button
            onClick={() => navigateTo("createChallenge")}
            className="create-challenge-header-button"
            aria-label="Kreiraj novi izazov"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs - SAMO 2 DUGMETA */}
      <div className="photo-challenge-tabs">
        <button
          onClick={() => setActiveTab("regular")}
          className={`photo-challenge-tab ${
            activeTab === "regular" ? "active" : ""
          }`}
        >
          <Trophy className="photo-challenge-tab-icon" />
          Standardni
        </button>
        <button
          onClick={() => setActiveTab("photo")}
          className={`photo-challenge-tab ${
            activeTab === "photo" ? "active" : ""
          }`}
        >
          <Camera className="photo-challenge-tab-icon" />
          Foto Izazovi
        </button>
      </div>

      {/* Content */}
      <div className="photo-challenge-content">
        {/* Regular Challenges Tab */}
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
                          width: `${getProgressPercentage(
                            challenge.progress,
                            challenge.total
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

        {/* Photo Challenges Tab */}
        {activeTab === "photo" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="photo-challenges"
          >
            {photoChallenges.map((challenge, index) => {
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
                        {challenge.difficulty === "easy"
                          ? "Lako"
                          : challenge.difficulty === "medium"
                          ? "Srednje"
                          : "Teško"}
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
