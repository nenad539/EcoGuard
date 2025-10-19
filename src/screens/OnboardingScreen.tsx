import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationContext } from '../App';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Recycle, Home, Users } from 'lucide-react';
import '../styles/OnboardingScreen.css';

const onboardingData = [
  {
    title: 'Prati svoje ekološke navike',
    description: 'Zapisuj i prati sve svoje ekološke aktivnosti svakodnevno',
    image: 'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Recycle,
  },
  {
    title: 'Smanji ugljeni otisak',
    description: 'Smanjuj svoj CO₂ otisak korak po korak',
    image: 'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Home,
  },
  {
    title: 'Udruži se s drugima',
    description: 'Pridruži se zajednici i podijeli svoje uspjehe',
    image: 'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: Users,
  },
];

export function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { navigateTo } = useContext(NavigationContext);

  const handleNext = () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigateTo('login');
    }
  };

  const handleSkip = () => {
    navigateTo('login');
  };

  const Icon = onboardingData[currentSlide].icon;

  return (
    <div className="onboarding-screen">
      {/* Skip button */}
      <div className="onboarding-skip-container">
        <button
          onClick={handleSkip}
          className="onboarding-skip-button"
        >
          Preskoči
        </button>
      </div>

      {/* Content */}
      <div className="onboarding-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="onboarding-slide"
          >
            {/* Icon */}
            <div className="onboarding-icon">
              <Icon />
            </div>

            {/* Image */}
            <div className="onboarding-image">
              <ImageWithFallback
                src={onboardingData[currentSlide].image}
                alt={onboardingData[currentSlide].title}
              />
            </div>

            {/* Title */}
            <h2 className="onboarding-title">
              {onboardingData[currentSlide].title}
            </h2>

            {/* Description */}
            <p className="onboarding-description">
              {onboardingData[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="onboarding-dots">
        {onboardingData.map((_, index) => (
          <div
            key={index}
            className={`onboarding-dot ${index === currentSlide ? 'active' : 'inactive'}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="onboarding-navigation">
        <button
          onClick={handleNext}
          className="onboarding-button"
        >
          {currentSlide < onboardingData.length - 1 ? 'Dalje' : 'Započni sada'}
        </button>
      </div>
    </div>
  );
}
