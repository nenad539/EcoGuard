import React, { useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { motion } from 'motion/react';
import { NavigationContext } from '../App';
import { BottomNav } from '../components/common/BottomNav';
import { Recycle, Zap, CloudRain, Star, Bell, User } from 'lucide-react';
import '../styles/HomeScreen.css';

export function HomeScreen() {
  const { userData, navigateTo } = useContext(NavigationContext);
  const SUPABASE_URL = "https://htmzdusvwcwkebghcdnb.supabase.co"
  const supabaseAnonkey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bXpkdXN2d2N3a2ViZ2hjZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTQ5NDMsImV4cCI6MjA4MDM3MDk0M30.25yoZoNAruxcJBSnw5ulk6EM3LKTtPixQZJWrTSc-A0";


  
  const [userName, setUserName] = useState('');

  const getUserName = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('korisnicko_ime');
    
    if (error) {
      console.error('Error fetching user:', error);
      return 'Korisnik';
    }
    
    return korisnik_profil?.[0]?.korisnicko_ime || 'Korisnik';
  };

  useEffect(() => {
    getUserName().then(name => setUserName(name));
  }, []);



  const getUserLevel = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('nivo');
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
    return korisnik_profil?.[0]?.nivo || 'Korisnik';
  };
  const [userLevel, setUserLevel] = useState('');
  useEffect(() => {
    getUserLevel().then(nivo => setUserLevel(nivo));
  }, []);

   const getUserReciklirano = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('reciklirano_stvari');
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
    return korisnik_profil?.[0]?.reciklirano_stvari || 'Korisnik';
  };
  
  const [userReciklirano, setUserReciklirano] = useState('');
  useEffect(() => {
    getUserReciklirano().then(reciklirano => setUserReciklirano(reciklirano));
  }, []);

  const getUserPoints = async () => {
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('ukupno_poena');
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
    return korisnik_profil?.[0]?.ukupno_poena || '0';
  };
  
  const [userPoints, setUserPoints] = useState('');
  useEffect(() => {
    getUserPoints().then(points => setUserPoints(points));
  }, []);


  const getActivityPoints = async () => {
    let { data: aktivnosti, error } = await supabase
      .from('aktivnosti')
      .select('poena_dodato');
    
    if (error) {
      console.error('Error fetching user:', error);
      return '20';
    }
    
    return aktivnosti?.[0]?.poena_dodato || '0';
  };
  
  const [poena_dodato, setActivityPoints] = useState('');
  useEffect(() => {
    getActivityPoints().then(poena_dodato => setActivityPoints(poena_dodato));
  }, []);


  const getActivityTitle = async () => {
    let { data: aktivnosti, error } = await supabase
      .from('aktivnosti')
      .select('opis');
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
    return aktivnosti?.[0]?.opis || '20';
  };
  
  const [activityTitle, setActivityTitle] = useState('');
  useEffect(() => {
    getActivityTitle().then(activityTitle => setActivityTitle(activityTitle));
  }, []);



  
const stats = [
    {
      icon: Recycle,
      label: 'Reciklirano',
      value: userReciklirano,
      unit: 'stvari',
      gradient: 'from-green-500 to-emerald-600',
    },
    
  
    {
      icon: Star,
      label: 'Ukupni poeni',
      value: userPoints,
      unit: 'poena',
      gradient: 'from-purple-500 to-pink-600',
    },
  ];



  


  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-content">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="home-welcome"
            >
              Dobro došao nazad, {userName}
              
            </motion.h1>
            <p className="home-level">Eco Čuvar Lv.{userLevel}</p>
          </div>
          <div className="home-nav-buttons">
            <button
              onClick={() => navigateTo('notifications')}
              className="home-nav-button"
            >
              <Bell />
            </button>
            <button
              onClick={() => navigateTo('profile')}
              className="home-profile-button"
            >
              <User />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="home-stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="home-stat-card"
            >
              <div className={`home-stat-icon ${stat.gradient.includes('green') ? 'green' : stat.gradient.includes('yellow') ? 'yellow' : stat.gradient.includes('blue') ? 'blue' : 'purple'}`}>
                <stat.icon />
              </div>
              <p className="home-stat-label">{stat.label}</p>
              <p className="home-stat-value">
                {stat.value}
                <span className="home-stat-unit">{stat.unit}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => navigateTo('challenges')}
            className="home-cta-button"
          >
            <Star />
            Dnevni Izazovi
          </button>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="home-section">
        <h2 className="home-section-title">Nedavne aktivnosti</h2>
        <div className="home-activity-list">
          {[
            { title: activityTitle, time: 'Prije 1 sat', points: poena_dodato, type: 'photo' },
            { title: 'Reciklirano 5 PET flaša', time: 'Prije 2 sata', points: '+50', type: 'standard' },
            { title: 'Kreiran novi foto izazov', time: 'Prije 4 sata', points: '+25', type: 'create' },
            { title: 'Završen izazov "Bicikl vikendom"', time: 'Prije 1 dan', points: '+120', type: 'standard' },
            { title: 'Fotografija na verifikaciji', time: 'Prije 2 dana', points: 'Na čekanju', type: 'pending' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`home-activity-item ${activity.type === 'photo' ? 'photo-activity' : activity.type === 'pending' ? 'pending-activity' : activity.type === 'create' ? 'create-activity' : ''}`}
            >
              <div>
                <p className="home-activity-title">{activity.title}</p>
                <p className="home-activity-time">{activity.time}</p>
              </div>
              <div className={`home-activity-points ${activity.type === 'pending' ? 'pending-points' : ''}`}>
                {activity.points}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-section">
        <h2 className="home-section-title">Brze akcije</h2>
        <div className="home-quick-actions">
          <button
            onClick={() => navigateTo('ecoTips')}
            className="home-quick-action"
          >
            <div className="home-quick-action-emoji"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#2bc154" d="M9.973 18H11v-5h2v5h1.027c.132-1.202.745-2.193 1.74-3.277c.113-.122.832-.867.917-.973a6 6 0 1 0-9.37-.002c.086.107.807.853.918.974c.996 1.084 1.609 2.076 1.741 3.278M10 20v1h4v-1zm-4.246-5a8 8 0 1 1 12.49.002C17.624 15.774 16 17 16 18.5V21a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.5C8 17 6.375 15.774 5.754 15"></path></svg></div>
            <p className="home-quick-action-title">Eko savjeti</p>
            <p className="home-quick-action-subtitle">Saznaj više</p>
          </button>
          <button
            onClick={() => navigateTo('community')}
            className="home-quick-action purple"
          >
            <div className="home-quick-action-emoji"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 512 512"><circle cx={152} cy={184} r={72} fill="#2bc154"></circle><path fill="#2bc154" d="M234 296c-28.16-14.3-59.24-20-82-20c-44.58 0-136 27.34-136 82v42h150v-16.07c0-19 8-38.05 22-53.93c11.17-12.68 26.81-24.45 46-34"></path><path fill="#2bc154" d="M340 288c-52.07 0-156 32.16-156 96v48h312v-48c0-63.84-103.93-96-156-96"></path><circle cx={340} cy={168} r={88} fill="#2bc154"></circle></svg></div>
            <p className="home-quick-action-title">Zajednica</p>
            <p className="home-quick-action-subtitle">Rang lista</p>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

