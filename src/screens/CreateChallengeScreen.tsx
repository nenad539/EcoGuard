import React, { useState } from "react";
import { motion } from "motion/react";
import { BottomNav } from "../components/common/BottomNav";
import {
  Plus,
  Trophy,
  Camera,
  Users,
  Calendar,
  MapPin,
  Tag,
  X,
  UserPlus,
  Clock,
  Hash,
  Image as ImageIcon,
  DollarSign,
  Target,
  Recycle,
  TreePine,
  Droplet,
  AlertCircle,
} from "lucide-react";
import { useContext } from "react";
import { NavigationContext } from "../App";
import "../styles/CreateChallengeScreen.css";

type ChallengeType = "regular" | "photo" | "group";

type ChallengeCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
};

// Tip za kontekst za čuvanje podataka između ekrana
interface CreateChallengeData {
  title?: string;
  description?: string;
  points?: number;
  location?: string;
  author?: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  timeLimit?: string;
  status?: "available";
}

export function CreateChallengeScreen() {
  const { navigateTo, setChallengeData } = useContext(NavigationContext);
  const [challengeType, setChallengeType] = useState<ChallengeType>("regular");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([
    "User1",
    "User2",
  ]);
  const [newMember, setNewMember] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: 100,
    duration: 7,
    location: "",
  });

  const challengeCategories: ChallengeCategory[] = [
    {
      id: "cleanup",
      name: "Čišćenje",
      icon: Target,
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "recycling",
      name: "Reciklaža",
      icon: Recycle,
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "nature",
      name: "Priroda",
      icon: TreePine,
      color: "from-emerald-500 to-green-600",
    },
    {
      id: "water",
      name: "Voda",
      icon: Droplet,
      color: "from-cyan-500 to-blue-600",
    },
    {
      id: "awareness",
      name: "Svest",
      icon: Users,
      color: "from-purple-500 to-violet-600",
    },
    {
      id: "other",
      name: "Ostalo",
      icon: Hash,
      color: "from-gray-500 to-slate-600",
    },
  ];

  const handleAddMember = () => {
    if (newMember.trim() && !groupMembers.includes(newMember.trim())) {
      setGroupMembers([...groupMembers, newMember.trim()]);
      setNewMember("");
    }
  };

  const handleRemoveMember = (member: string) => {
    setGroupMembers(groupMembers.filter((m) => m !== member));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "points" || name === "duration" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Kreiraj novi izazov
    const newChallenge: CreateChallengeData = {
      title: formData.title,
      description: formData.description,
      points: formData.points,
      location: formData.location,
      author: "Ja", // Ovde bi bilo trenutno ulogovanog korisnika
      difficulty: "medium", // Možeš dodati selector za difficulty
      category: selectedCategory || "other",
      timeLimit: `${formData.duration} dana`,
      status: "available",
    };

    // Sačuvaj podatke u kontekst
    if (setChallengeData) {
      setChallengeData(newChallenge);
    }

    console.log("Challenge created:", newChallenge);

    // Navigiraj na Photo Challenges sa aktivnim foto tabom
    if (challengeType === "photo") {
      // Ako je foto izazov, idi na foto tab
      navigateTo("challenges", "photo");
    } else {
      // Ako je regular ili grupni, idi na regular tab
      navigateTo("challenges", "regular");
    }
  };

  const handleCancel = () => {
    navigateTo("challenges");
  };

  return (
    <div className="create-challenge-screen">
      {/* Header */}
      <div className="create-challenge-header">
        <div className="create-header-content">
          <div className="create-header-text">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="create-challenge-title"
            >
              Kreiraj Izazov{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
              >
                <path
                  fill="#2bc154"
                  d="M7 21v-2h4v-3.1q-1.225-.275-2.187-1.037T7.4 12.95q-1.875-.225-3.137-1.637T3 8V7q0-.825.588-1.412T5 5h2V3h10v2h2q.825 0 1.413.588T21 7v1q0 1.9-1.263 3.313T16.6 12.95q-.45 1.15-1.412 1.913T13 15.9V19h4v2z"
                ></path>
              </svg>
            </motion.h1>
            <p className="create-challenge-subtitle">
              Napravi izazov i pozovi društvo
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="close-challenge-button"
            aria-label="Zatvori"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="create-challenge-form">
        {/* Challenge Type Selection */}
        <div className="form-section">
          <label className="form-label">Vrsta izazova</label>
          <div className="challenge-type-grid">
            <button
              type="button"
              onClick={() => setChallengeType("regular")}
              className={`challenge-type-btn ${
                challengeType === "regular" ? "active" : ""
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Standardni</span>
            </button>
            <button
              type="button"
              onClick={() => setChallengeType("photo")}
              className={`challenge-type-btn ${
                challengeType === "photo" ? "active" : ""
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Foto Izazov</span>
            </button>
            <button
              type="button"
              onClick={() => setChallengeType("group")}
              className={`challenge-type-btn ${
                challengeType === "group" ? "active" : ""
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Grupni</span>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <label className="form-label">Naziv izazova</label>
          <input
            type="text"
            name="title"
            placeholder="Unesi naziv izazova..."
            className="form-input"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-section">
          <label className="form-label">Opis</label>
          <textarea
            name="description"
            placeholder="Opis izazova i uputstva..."
            className="form-textarea"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Category Selection */}
        <div className="form-section">
          <label className="form-label">Kategorija</label>
          <div className="category-grid">
            {challengeCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-btn ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                >
                  <div className={`category-icon ${category.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Points and Duration */}
        <div className="form-row">
          <div className="form-section half">
            <label className="form-label">Poeni</label>
            <div className="input-with-icon">
              <DollarSign className="input-icon" />
              <input
                type="number"
                name="points"
                placeholder="100"
                min="1"
                max="1000"
                className="form-input"
                value={formData.points}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-section half">
            <label className="form-label">Trajanje (dani)</label>
            <div className="input-with-icon">
              <Clock className="input-icon" />
              <input
                type="number"
                name="duration"
                placeholder="7"
                min="1"
                max="365"
                className="form-input"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <label className="form-label">Lokacija (opciono)</label>
          <div className="input-with-icon">
            <MapPin className="input-icon" />
            <input
              type="text"
              name="location"
              placeholder="Unesi lokaciju..."
              className="form-input"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Photo Upload for Photo Challenges */}
        {challengeType === "photo" && (
          <div className="form-section">
            <label className="form-label">
              Referentna fotografija (opciono)
            </label>
            <div className="photo-upload-area">
              <ImageIcon className="upload-icon" />
              <span>Dodaj fotografiju za primer</span>
              <input type="file" accept="image/*" className="file-input" />
            </div>
          </div>
        )}

        {/* Group Members for Group Challenges */}
        {challengeType === "group" && (
          <div className="form-section">
            <label className="form-label">Članovi grupe</label>
            <div className="group-members-input">
              <div className="input-with-button">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Dodaj korisnika..."
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="add-member-btn"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              <div className="group-members-list">
                {groupMembers.map((member) => (
                  <div key={member} className="group-member-tag">
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      className="remove-member-btn"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="advanced-toggle-btn"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Napredne opcije</span>
        </button>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="advanced-options"
          >
            <div className="form-section">
              <label className="form-label">Tagovi (opciono)</label>
              <div className="input-with-icon">
                <Tag className="input-icon" />
                <input
                  type="text"
                  placeholder="npr. ekologija, reciklaža, čišćenje..."
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Datum početka (opciono)</label>
              <div className="input-with-icon">
                <Calendar className="input-icon" />
                <input type="date" className="form-input" />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label checkbox-label">
                <input type="checkbox" className="form-checkbox" />
                <span>Javni izazov (vidljiv svima)</span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-btn">
            Otkaži
          </button>
          <button type="submit" className="submit-btn">
            <Plus className="w-5 h-5" />
            Kreiraj Izazov
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
