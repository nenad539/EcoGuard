import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Check, Upload, Star, MapPin, Clock } from 'lucide-react';
import '../styles/PhotoSubmission.css';

type PhotoSubmissionProps = {
  challengeId: number;
  challengeTitle: string;
  challengePoints: number;
  onSubmit: (submission: {
    challengeId: number;
    photo: string;
    description: string;
    location?: string;
  }) => void;
  onCancel: () => void;
};

export function PhotoSubmission({
  challengeId,
  challengeTitle,
  challengePoints,
  onSubmit,
  onCancel
}: PhotoSubmissionProps) {
  const [submissionStep, setSubmissionStep] = useState<'capture' | 'details' | 'confirm'>('capture');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhoto(e.target?.result as string);
        setSubmissionStep('details');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageCapture = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSubmit({
      challengeId,
      photo: capturedPhoto,
      description,
      location
    });
    
    setIsSubmitting(false);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setSubmissionStep('capture');
  };

  return (
    <motion.div 
      className="photo-submission-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="photo-submission-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="photo-submission-header">
          <div>
            <h3>Prihvati izazov</h3>
            <p>{challengeTitle}</p>
          </div>
          <button onClick={onCancel} className="close-button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {submissionStep === 'capture' && (
            <motion.div
              key="capture"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="submission-step"
            >
              <div className="capture-section">
                <div className="capture-instructions">
                  <Camera className="w-16 h-16" />
                  <h4>Fotografiši dokaz</h4>
                  <p>Fotografiraj da si završio/la ovaj izazov</p>
                </div>
                
                <button 
                  onClick={triggerImageCapture}
                  className="capture-button"
                >
                  <Camera className="w-6 h-6" />
                  Otvori kameru
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  style={{ display: 'none' }}
                />
              </div>
            </motion.div>
          )}

          {submissionStep === 'details' && (
            <motion.div
              key="details"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="submission-step"
            >
              <div className="photo-preview">
                <img src={capturedPhoto!} alt="Captured submission" />
                <button onClick={retakePhoto} className="retake-button">
                  <Camera className="w-4 h-4" />
                  Ponovo fotografiši
                </button>
              </div>

              <div className="submission-details">
                <div className="form-group">
                  <label>Opis (opcionalno)</label>
                  <textarea
                    placeholder="Opišite kako ste završili izazov..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Lokacija (opcionalno)</label>
                  <div className="location-input">
                    <MapPin className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Dodajte lokaciju..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="submission-reward">
                  <Star className="w-5 h-5" />
                  <span>Osvojićete {challengePoints} poena</span>
                </div>
              </div>

              <div className="submission-actions">
                <button onClick={retakePhoto} className="secondary-button">
                  Nazad
                </button>
                <button 
                  onClick={() => setSubmissionStep('confirm')}
                  className="primary-button"
                >
                  Dalje
                </button>
              </div>
            </motion.div>
          )}

          {submissionStep === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="submission-step"
            >
              <div className="confirmation-content">
                <div className="confirm-photo">
                  <img src={capturedPhoto!} alt="Submission confirmation" />
                </div>

                <div className="confirm-details">
                  <h4>Potvrdi slanje</h4>
                  <div className="confirm-info">
                    <div className="confirm-item">
                      <strong>Izazov:</strong> {challengeTitle}
                    </div>
                    <div className="confirm-item">
                      <strong>Nagrada:</strong> +{challengePoints} poena
                    </div>
                    {description && (
                      <div className="confirm-item">
                        <strong>Opis:</strong> {description}
                      </div>
                    )}
                    {location && (
                      <div className="confirm-item">
                        <strong>Lokacija:</strong> {location}
                      </div>
                    )}
                  </div>

                  <div className="validation-notice">
                    <Clock className="w-4 h-4" />
                    <span>Vaša fotografija će biti pregledana u roku od 24h</span>
                  </div>
                </div>
              </div>

              <div className="submission-actions">
                <button 
                  onClick={() => setSubmissionStep('details')}
                  className="secondary-button"
                  disabled={isSubmitting}
                >
                  Nazad
                </button>
                <button 
                  onClick={handleSubmit}
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Upload className="w-4 h-4 animate-spin" />
                      Šalje se...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Pošalji
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
