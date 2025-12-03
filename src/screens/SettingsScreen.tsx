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
        {
          id: 'terms',
          icon: Info,
          label: 'Uslovi korišćenja',
          description: 'Pročitaj pravila korišćenja',
          type: 'link' as const,
          onClick: () => navigateTo('terms'),
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
          Podešavanja <svg xmlns="http://www.w3.org/2000/svg" width={30} height={30} viewBox="0 0 24 24"><path fill="#2bc154" d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z"></path></svg>
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
                  <div
                    className="settings-item"
                    onClick={() => {
                      if (item.type !== 'toggle' && (item as any).onClick) {
                        (item as any).onClick();
                      }
                    }}
                    role={item.type !== 'toggle' ? 'button' : undefined}
                    tabIndex={item.type !== 'toggle' ? 0 : undefined}
                  >
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
          <h3 className="settings-app-info-title">GrowWithUs</h3>
          <p className="settings-app-info-description">
            Čuvaj prirodu.
          </p>
          <div className="settings-app-info-details">
            <p>Verzija 1.0.0</p>
            <p>© 2025 GrowWithUs Nenad</p>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="settings-contact">
        <div className="settings-contact-card">
          <h3 className="settings-contact-title">Kontakt i podrška</h3>
          <div className="settings-contact-list">
            <button className="settings-contact-button">
              📧 support@growwithus.com
            </button>
            <button className="settings-contact-button">
              🌐 www.growwithus.com
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
