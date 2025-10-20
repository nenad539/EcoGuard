import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNav } from '../components/common/BottomNav';
import { ArrowLeft, Moon, Sun, Bell, Globe, Shield, Info, ChevronRight } from 'lucide-react';
import { useContext } from 'react';
import { NavigationContext } from '../App';
import '../styles/SettingsScreen.css';

export function SettingsScreen() {
  const { navigateTo } = useContext(NavigationContext);
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    language: 'srpski',
  });

  const settingsSections = [
    {
      title: 'Izgled',
      items: [
        {
          id: 'theme',
          icon: settings.darkMode ? Moon : Sun,
          label: 'Tema',
          description: 'Light / Dark',
          type: 'toggle' as const,
          value: settings.darkMode,
          onChange: (value: boolean) => setSettings({ ...settings, darkMode: value }),
        },
      ],
    },
    {
      title: 'Obavještenja',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: 'Push obavještenja',
          description: 'Primaj obavještenja o novim izazovima',
          type: 'toggle' as const,
          value: settings.notifications,
          onChange: (value: boolean) => setSettings({ ...settings, notifications: value }),
        },
      ],
    },
    {
      title: 'Jezik i region',
      items: [
        {
          id: 'language',
          icon: Globe,
          label: 'Jezik',
          description: 'Srpski / Engleski',
          type: 'link' as const,
          value: settings.language,
        },
      ],
    },
    {
      title: 'Privatnost i bezbjednost',
      items: [
        {
          id: 'privacy',
          icon: Shield,
          label: 'Privatnost i dozvole',
          description: 'Upravljaj pristupom aplikaciji',
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'O aplikaciji',
      items: [
        {
          id: 'about',
          icon: Info,
          label: 'O aplikaciji',
          description: 'Verzija 1.0.0',
          type: 'link' as const,
        },
      ],
    },
  ];

  return (
    <div className="settings-screen">
      {/* Header */}
      <div className="settings-header">
        <button
          onClick={() => navigateTo('home')}
          className="settings-back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="settings-title"
        >
          Podešavanja ⚙️
        </motion.h1>
        <p className="settings-subtitle">Prilagodi svoju aplikaciju</p>
      </div>

      {/* Settings Sections */}
      <div className="settings-content">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="settings-section"
          >
            <h3 className="settings-section-title">{section.title}</h3>
            <div className="settings-section-container">
              {section.items.map((item, itemIndex) => (
                <div key={item.id}>
                  <div className="settings-item">
                    <div className="settings-item-icon">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="settings-item-content">
                      <p className="settings-item-label">{item.label}</p>
                      <p className="settings-item-description">{item.description}</p>
                    </div>
                    {item.type === 'toggle' ? (
                      <button
                        className={`settings-toggle ${item.value ? 'checked' : ''}`}
                        onClick={() => item.onChange && item.onChange(!item.value)}
                      >
                        <div className="settings-toggle-thumb"></div>
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  {itemIndex < section.items.length - 1 && (
                    <div className="settings-item-separator" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* App Info */}
      <div className="settings-app-info">
        <div className="settings-app-info-card">
          <div className="settings-app-info-emoji">🌱</div>
          <h3 className="settings-app-info-title">EcoGuard</h3>
          <p className="settings-app-info-description">
            Čuvaj prirodu. Postani EcoGuard.
          </p>
          <div className="settings-app-info-details">
            <p>Verzija 1.0.0</p>
            <p>© 2025 EcoGuard Nenad</p>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="settings-contact">
        <div className="settings-contact-card">
          <h3 className="settings-contact-title">Kontakt i podrška</h3>
          <div className="settings-contact-list">
            <button className="settings-contact-button">
              📧 support@ecoguard.com
            </button>
            <button className="settings-contact-button">
              🌐 www.ecoguard.com
            </button>
            <button className="settings-contact-button">
              📱 Pratite nas na društvenim mrežama
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
