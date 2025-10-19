import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BottomNav } from '../components/common/BottomNav';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ArrowLeft, Lightbulb, Droplet, Zap, Recycle, Home, Wind, X } from 'lucide-react';
import { useContext } from 'react';
import { NavigationContext } from '../App';
import '../styles/EcoTipsScreen.css';

type EcoTip = {
  id: number;
  title: string;
  description: string;
  details: string;
  category: 'energy' | 'water' | 'recycling' | 'transport' | 'home';
  icon: React.ElementType;
  image: string;
  color: string;
  impact: string;
};

export function EcoTipsScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [selectedTip, setSelectedTip] = useState<EcoTip | null>(null);

  const tips: EcoTip[] = [
    {
      id: 1,
      title: 'Isključi svjetla kad izlaziš',
      description: 'Isključivanje svjetala može uštedjeti do 15% energije',
      details:
        'Isključivanje nepotrebnih svjetala je jedan od najjednostavnijih načina za uštedu energije. Kada napuštaš sobu, uvijek provjeri da li su sva svjetla isključena. Razmotri i korištenje LED sijalica koje troše 75% manje energije od klasičnih žarulja.',
      category: 'energy',
      icon: Zap,
      image: 'https://images.unsplash.com/photo-1737372805905-be0b91ec86fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY28lMjB0aXBzJTIwc3VzdGFpbmFibGV8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-yellow-500 to-orange-600',
      impact: 'Ušteda do 15% na mjesečnom računu',
    },
    {
      id: 2,
      title: 'Koristi višekratne kese',
      description: 'Zamijeni plastične kese trajnim alternativama',
      details:
        'Plastične kese zagađuju naše okeane i tlo. Jedna pamučna torba može zamijeniti preko 700 plastičnih kesa tokom svog životnog vijeka. Uvijek nosi sa sobom višekratne kese kada ideš u kupovinu.',
      category: 'recycling',
      icon: Recycle,
      image: 'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-green-500 to-emerald-600',
      impact: 'Smanjenje plastičnog otpada za 90%',
    },
    {
      id: 3,
      title: 'Šetaj umjesto vožnje',
      description: 'Pješačenje smanjuje CO₂ emisije',
      details:
        'Za kratke udaljenosti, umjesto korištenja automobila, probaj pješačiti ili voziti bicikl. To ne samo da smanjuje ugljični otisak, već je i odlično za tvoje zdravlje. Samo 30 minuta pješačenja dnevno može značajno poboljšati tvoje opšte blagostanje.',
      category: 'transport',
      icon: Wind,
      image: 'https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwZW9wbGUlMjB0b2dldGhlcnxlbnwxfHx8fDE3NjA4NjEwNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-cyan-500 to-blue-600',
      impact: 'Smanjenje CO₂ do 2kg dnevno',
    },
    {
      id: 4,
      title: 'Zatvaraj vodu dok peru zube',
      description: 'Uštedi do 8 litara vode dnevno',
      details:
        'Zatvaranje slavine dok peru zube može uštedjeti do 8 litara vode po pranju. Tokom cijele godine, to je preko 2,900 litara uštedene vode po osobi. Primijeni ovu jednostavnu naviku i pomozi u očuvanju ove vrijedne prirodne resurse.',
      category: 'water',
      icon: Droplet,
      image: 'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-blue-500 to-cyan-600',
      impact: 'Ušteda preko 2,900L godišnje',
    },
    {
      id: 5,
      title: 'Izoliraj prozore i vrata',
      description: 'Smanji gubitak toplote i štedi energiju',
      details:
        'Ispravan izolacija prozora i vrata može smanjiti gubitak toplote za do 30%. Koristi gumene brtve i zatvori sve pukotine kako bi tvoj dom bio energetski efikasniji. Ovo će ti pomoći da smanjiš troškove grijanja zimi i hlađenja ljeti.',
      category: 'home',
      icon: Home,
      image: 'https://images.unsplash.com/photo-1580933907066-9a0a6fe5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGhvdXNlJTIwdHJlZXN8ZW58MXx8fHwxNzYwOTAyMzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-purple-500 to-pink-600',
      impact: 'Smanjenje potrošnje energije za 30%',
    },
    {
      id: 6,
      title: 'Recikliraj elektronski otpad',
      description: 'Pravilno odlaži stare uređaje',
      details:
        'Elektronski otpad sadrži opasne materijale koji mogu zagaditi zemlju i vodu. Uvijek odnosi stare telefone, računare i druge uređaje u ovlaštene centre za reciklažu. Mnogi djelovi mogu biti reciklirani i korišteni u novim proizvodima.',
      category: 'recycling',
      icon: Recycle,
      image: 'https://images.unsplash.com/photo-1654718421032-8aee5603b51f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBib3R0bGVzJTIwZWNvfGVufDF8fHx8MTc2MDg3OTYwNHww&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'from-green-600 to-lime-600',
      impact: 'Sprječavanje zagađenja zemljišta',
    },
  ];

  const categories = [
    { id: 'all', label: 'Sve', icon: Lightbulb },
    { id: 'energy', label: 'Energija', icon: Zap },
    { id: 'water', label: 'Voda', icon: Droplet },
    { id: 'recycling', label: 'Reciklaža', icon: Recycle },
    { id: 'transport', label: 'Transport', icon: Wind },
    { id: 'home', label: 'Dom', icon: Home },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTips =
    selectedCategory === 'all'
      ? tips
      : tips.filter((tip) => tip.category === selectedCategory);

  return (
    <div className="eco-tips-screen">
      {/* Header */}
      <div className="eco-tips-header">
        <button
          onClick={() => navigateTo('home')}
          className="eco-tips-back-button"
        >
          <ArrowLeft />
          Nazad
        </button>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="eco-tips-title"
        >
          Eko savjeti 💡
        </motion.h1>
        <p className="eco-tips-subtitle">Naučite kako da živite održivije</p>
      </div>

      {/* Category Filter */}
      <div className="eco-tips-header">
        <div className="eco-tips-categories">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`eco-tips-category-button ${
                selectedCategory === category.id ? 'active' : ''
              }`}
            >
              <category.icon />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      <div className="eco-tips-grid">
        {filteredTips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedTip(tip)}
            className="eco-tip-card"
          >
            <div className="eco-tip-image-container">
              <ImageWithFallback
                src={tip.image}
                alt={tip.title}
                className="eco-tip-image"
              />
              <div className="eco-tip-image-overlay" />
              <div className="eco-tip-icon">
                <tip.icon />
              </div>
            </div>
            <div className="eco-tip-content">
              <h3 className="eco-tip-title">{tip.title}</h3>
              <p className="eco-tip-description">{tip.description}</p>
              <div className="eco-tip-footer">
                <span className="eco-tip-impact">💚 {tip.impact}</span>
                <span className="eco-tip-read-more">
                  Saznaj više →
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tip Detail Modal */}
      {selectedTip && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="eco-tip-modal-overlay"
            onClick={() => setSelectedTip(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="eco-tip-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="eco-tip-modal-header">
                <button
                  onClick={() => setSelectedTip(null)}
                  className="eco-tip-modal-close"
                >
                  <X />
                </button>
                <ImageWithFallback
                  src={selectedTip.image}
                  alt={selectedTip.title}
                  className="eco-tip-modal-image"
                />
                <h2 className="eco-tip-modal-title">{selectedTip.title}</h2>
                <p className="eco-tip-modal-subtitle">
                  {selectedTip.description}
                </p>
              </div>
              <div className="eco-tip-modal-body">
                <p className="eco-tip-modal-details">{selectedTip.details}</p>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h4 className="text-green-400 mb-2">Uticaj na okolinu:</h4>
                  <p className="text-white">{selectedTip.impact}</p>
                </div>
              </div>
              <div className="eco-tip-modal-footer">
                <button
                  onClick={() => setSelectedTip(null)}
                  className="eco-tip-modal-button"
                >
                  Primijeni savjet
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      <BottomNav />
    </div>
  );
}
