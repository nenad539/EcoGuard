import React, { useContext, useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "../supabase-client";
import { NavigationContext } from "../App";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Image,
  Globe,
  Camera,
  X,
} from "lucide-react";
import "../styles/EditProfileScreen.css";

export function EditProfileScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatarUrl: "",
    location: "",
    website: "",
  });

  // Get user ID helper
  const getUserId = async (): Promise<string | undefined> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (userId) return userId;
    } catch (e) {
      console.warn("Error getting auth user:", e);
    }

    try {
      const { data: idData } = await supabase
        .from("korisnik_profil")
        .select("id")
        .limit(1);
      return idData?.[0]?.id;
    } catch (e) {
      console.error("Error fetching user id:", e);
      return undefined;
    }
  };

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        alert("Korisnik nije pronađen");
        navigateTo("profile");
        return;
      }

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from("korisnik_profil")
        .select("korisnicko_ime, email, bio, avatar_url, lokacija, website")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        return;
      }

      // Get auth email
      const { data: authData } = await supabase.auth.getUser();

      const data = {
        name: profileData?.korisnicko_ime || "",
        email: authData?.user?.email || profileData?.email || "",
        bio: profileData?.bio || "",
        avatarUrl: profileData?.avatar_url || "",
        location: profileData?.lokacija || "",
        website: profileData?.website || "",
      };

      setFormData(data);
      if (data.avatarUrl) {
        setPreviewUrl(data.avatarUrl);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Molimo odaberite sliku");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Slika je prevelika. Maksimalna veličina je 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // In a real app, you would upload to Supabase Storage here
    // For now, we'll just store the file
    setFormData((prev) => ({
      ...prev,
      avatarUrl: URL.createObjectURL(file),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Ime je obavezno polje");
      return;
    }

    setSaving(true);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Korisnik nije pronađen");

      // Upload avatar to Supabase Storage if changed
      let finalAvatarUrl = formData.avatarUrl;

      // For now, we'll skip actual upload and just update the URL
      // In production, you would:
      // 1. Upload to Supabase Storage
      // 2. Get public URL
      // 3. Store that URL in database

      // Update profile in database
      const { error: profileError } = await supabase
        .from("korisnik_profil")
        .update({
          korisnicko_ime: formData.name.trim(),
          bio: formData.bio.trim(),
          avatar_url: finalAvatarUrl,
          lokacija: formData.location.trim(),
          website: formData.website.trim(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update email in auth if changed
      if (formData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email.trim(),
        });

        if (
          emailError &&
          emailError.message !== "Email change requires confirmation"
        ) {
          console.warn("Email update warning:", emailError);
        }
      }

      // Show success and navigate back
      alert("Profil je uspješno ažuriran!");
      navigateTo("profile");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(error.message || "Došlo je do greške prilikom ažuriranja profila");
    } finally {
      setSaving(false);
    }
  };

  // Handle remove avatar
  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
  };

  if (loading) {
    return (
      <div className="edit-profile-screen">
        <div className="edit-profile-header">
          <button
            onClick={() => navigateTo("profile")}
            className="edit-profile-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Nazad
          </button>
        </div>
        <div className="edit-profile-loading">
          <div className="edit-profile-spinner"></div>
          <p>Učitavanje profila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-screen">
      {/* Header */}
      <div className="edit-profile-header">
        <button
          onClick={() => navigateTo("profile")}
          className="edit-profile-back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>
        <h1 className="edit-profile-title">Uredi profil</h1>
        <div style={{ width: "60px" }}></div> {/* Spacer for alignment */}
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Avatar Section */}
        <div className="edit-profile-avatar-section">
          <div className="edit-profile-avatar-container">
            <div className="edit-profile-avatar-preview">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="edit-profile-avatar-image"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="edit-profile-avatar-remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="edit-profile-avatar-placeholder">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="edit-profile-avatar-actions">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="edit-profile-avatar-input"
              />
              <label
                htmlFor="avatar-upload"
                className="edit-profile-avatar-upload-button"
              >
                <Camera className="w-4 h-4" />
                {previewUrl ? "Promijeni sliku" : "Dodaj sliku"}
              </label>

              {!previewUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      avatarUrl:
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                        formData.name,
                    }))
                  }
                  className="edit-profile-avatar-generate"
                >
                  Generiši avatar
                </button>
              )}
            </div>

            <p className="edit-profile-avatar-hint">
              Preporučena veličina: 500x500px. Maksimalno 5MB.
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">Osnovne informacije</h2>

          <div className="edit-profile-field-group">
            <div className="edit-profile-field">
              <label htmlFor="name" className="edit-profile-label">
                <User className="w-4 h-4" />
                Ime i prezime *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="edit-profile-input"
                placeholder="Unesite vaše ime i prezime"
                required
              />
            </div>

            <div className="edit-profile-field">
              <label htmlFor="email" className="edit-profile-label">
                <Mail className="w-4 h-4" />
                Email adresa *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="edit-profile-input"
                placeholder="unesite@email.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">O meni</h2>
          <div className="edit-profile-field">
            <label htmlFor="bio" className="edit-profile-label">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="edit-profile-textarea"
              placeholder="Napišite nešto o sebi..."
              rows={4}
              maxLength={500}
            />
            <div className="edit-profile-char-count">
              {formData.bio.length}/500 karaktera
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="edit-profile-section">
          <h2 className="edit-profile-section-title">Dodatne informacije</h2>

          <div className="edit-profile-field-group">
            <div className="edit-profile-field">
              <label htmlFor="location" className="edit-profile-label">
                <Globe className="w-4 h-4" />
                Lokacija
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="edit-profile-input"
                placeholder="Gdje živite?"
              />
            </div>

            <div className="edit-profile-field">
              <label htmlFor="website" className="edit-profile-label">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="edit-profile-input"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="edit-profile-actions">
          <button
            type="button"
            onClick={() => navigateTo("profile")}
            className="edit-profile-cancel-button"
            disabled={saving}
          >
            Otkaži
          </button>

          <button
            type="submit"
            className="edit-profile-save-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="edit-profile-save-spinner"></div>
                Čuvanje...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sačuvaj promjene
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
