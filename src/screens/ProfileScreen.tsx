import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase-client';
import { useState, useEffect } from 'react';
import { NavigationContext } from '../App';
import { BottomNav } from '../components/common/BottomNav';
import { ArrowLeft, Edit, BarChart3, LogOut, Award, Target, Flame } from 'lucide-react';
import '../styles/ProfileScreen.css';

export function ProfileScreen() {
  const { userData, navigateTo } = useContext(NavigationContext);



const [userStreak, setUserStreak] = useState<string>('0');



const updateAndGetStreak = async (): Promise<number> => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return 0;

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];

  const { data } = await supabase
    .from('korisnik_profil')
    .select('dnevna_serija, posljednji_login')
    .eq('id', userId)
    .single();

  if (!data) return 0;

  let streak = data.dnevna_serija ?? 0;

  if (!data.posljednji_login) {
    streak = 1;
  } else {
    const last = new Date(data.posljednji_login);
    const diff =
      (today.setHours(0,0,0,0) - last.setHours(0,0,0,0)) / 86400000;

    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  }

  await supabase
    .from('korisnik_profil')
    .update({
      dnevna_serija: streak,
      posljednji_login: todayDate,
    })
    .eq('id', userId);

  return streak;
};
useEffect(() => {
  updateAndGetStreak().then(s => setUserStreak(String(s)));
}, []);

useEffect(() => {
  updateAndGetStreak().then((streak) => {
    setUserStreak(String(streak));
  });
}, []);

useEffect(() => {
  updateAndGetStreak().then(streak => {
    setUserStreak(String(streak));
  });
}, []);


  const getUserId = async (): Promise<string | undefined> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('auth.getUser error (fallback to table):', authError.message || authError);
      }
      const userId = authData?.user?.id;
      if (userId) return userId;
    } catch (e) {
      console.warn('auth.getUser threw, will fallback to selecting first profile id', e);
    }

     try {
      const { data: idData, error: idError } = await supabase.from('korisnik_profil').select('id').limit(1);
      if (idError) {
        console.error('Error fetching user id (fallback):', idError);
        return undefined;
      }
      return idData?.[0]?.id;
    } catch (e) {
      console.error('Unexpected error fetching fallback id:', e);
      return undefined;
    }
  };


const getUserCompleted = async () => {
    const userId = await getUserId();
    if (!userId) return '0';
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('izazova_zavrseno')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
  return korisnik_profil?.izazova_zavrseno || '0';
  };
  const [userCompleted, setUserCompleted] = useState('');
  useEffect(() => {
    getUserCompleted().then(izazova_zavrseno => setUserCompleted(izazova_zavrseno));
  }, []);


  



    const getUserPoints = async () => {
      const userId = await getUserId();
      if (!userId) return '0';
      let { data: korisnik_profil, error } = await supabase
        .from('korisnik_profil')
        .select('ukupno_poena')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return '0';
      }
      
  return korisnik_profil?.ukupno_poena || '0';
    };
    
    const [userPoints, setUserPoints] = useState('');
    useEffect(() => {
      getUserPoints().then(points => setUserPoints(points));
    }, []);


    const getUserName = async () => {
        const userId = await getUserId();
        if (!userId) return 'Korisnik';
        let { data: korisnik_profil, error } = await supabase
          .from('korisnik_profil')
          .select('korisnicko_ime')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching user:', error);
          return '0';
        }






        
  return korisnik_profil?.korisnicko_ime || 'Korisnik';
      };
      const [userName, setUserName] = useState('');
      useEffect(() => {
        getUserName().then(korisnicko_ime => setUserName(korisnicko_ime));
      }, []);


       const getUserLevel = async () => {
          const userId = await getUserId();
          if (!userId) return '0';
          let { data: korisnik_profil, error } = await supabase
            .from('korisnik_profil')
            .select('nivo')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching user:', error);
            return '0';
          }
          
          return korisnik_profil?.nivo || 'Korisnik';
        };
        const [userLevel, setUserLevel] = useState('');
        useEffect(() => {
          getUserLevel().then(nivo => setUserLevel(nivo));
        }, []);


        // Consolidated recent activities for profile
        const [activities, setActivities] = useState<any[]>([]);

        const getRecentActivities = async () => {
          try {
            // try to fetch recent activities (single request)
            const { data: aktivnosti, error } = await supabase
              .from('aktivnosti')
              .select('id, opis, poena_dodato, kategorija, status')
              .order('created_at', { ascending: false })
              .limit(6);

            if (error) {
              console.error('Error fetching aktivnosti for profile:', error);
              setActivities([]);
              return;
            }

            setActivities(aktivnosti ?? []);
          } catch (e) {
            console.error('Unexpected error fetching aktivnosti for profile:', e);
            setActivities([]);
          }
        };

        useEffect(() => {
          getRecentActivities();
        }, []);

  const points = Number(userPoints || 0);


  const achievements = [
  {
    id: 1,
    title: 'Početnik',
    description: 'Sakupi 100 poena',
    requiredPoints: 100,
    unlocked: points >= 100,
    icon: <Award />,
  },
  {
    id: 2,
    title: 'Aktivan član',
    description: 'Sakupi 500 poena',
    requiredPoints: 500,
    unlocked: points >= 500,
    icon: <Target />,
  },
  {
    id: 3,
    title: 'Eko borac',
    description: 'Sakupi 1000 poena',
    requiredPoints: 1000,
    unlocked: points >= 1000,
    icon: <Flame />,
  },
  {
    id: 4,
    title: 'Eko heroj',
    description: 'Sakupi 2500 poena',
    requiredPoints: 2500,
    unlocked: points >= 2500,
    icon: <Award />,
  },
  {
    id: 5,
    title: 'Legenda prirode',
    description: 'Sakupi 5000 poena',
    requiredPoints: 5000,
    unlocked: points >= 5000,
    icon: <Award />,
  },
];


  const stats = [
    { label: 'Izazova završeno', value: userCompleted, icon: Target },
    { label: 'Dnevna serija', value: userStreak, icon: Flame },
    { label: 'Ukupno poena', value: Number(userPoints).toLocaleString(), icon: Award },
  ];





  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="profile-header">
        <button
          onClick={() => navigateTo('home')}
          className="profile-back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          Nazad
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-card">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card-content"
        >
          <div className="profile-info">
            <div className="profile-avatar">
              {userData.name[0]}
            </div>
            <div className="profile-details">
              <h2 className="profile-name">{userName}</h2>
              <div className="profile-badges">
                <span className="profile-badge profile-badge-level">
                  Eco Čuvar Lv.{userLevel}
                </span>
                <span className="profile-badge profile-badge-rank">
                  Bronza
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="profile-action-button">
              <Edit className="w-4 h-4" />
              Uredi profil
            </button>
            <button
              onClick={() => navigateTo('statistics')}
              className="profile-action-button"
            >
              <BarChart3 className="w-4 h-4" />
              Statistika
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats">
        <h3 className="profile-section-title">Tvoja statistika</h3>
        <div className="profile-stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="profile-stat-card"
            >
              <div className="profile-stat-icon">
                <stat.icon />
              </div>
              <p className="profile-stat-value">{stat.value}</p>
              <p className="profile-stat-label">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="profile-achievements">
        <h3 className="profile-section-title">Dostignuća</h3>
        <div className="profile-achievements-grid">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`profile-achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className={`profile-achievement-icon ${!achievement.unlocked ? 'locked' : ''}`}>
                {achievement.icon}
              </div>
              <h4 className={`profile-achievement-title ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                {achievement.title}
              </h4>
              <p className={`profile-achievement-description ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                {achievement.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="profile-activity">
        <h3 className="profile-section-title">Nedavne aktivnosti</h3>
        <div className="profile-activity-list">
          {[
            { action: 'Završen izazov "Bicikl vikendom"', date: 'Prije 1 dan', points: '+120' },
            { action: 'Reciklirano 10 staklenih flaša', date: 'Prije 2 dana', points: '+80' },
            { action: 'Posađeno stablo u gradskom parku', date: 'Prije 5 dana', points: '+200' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="profile-activity-item"
            >
              <div className="profile-activity-content">
                <p className="profile-activity-action">{activity.action}</p>
                <p className="profile-activity-date">{activity.date}</p>
              </div>
              <div className="profile-activity-points">{activity.points}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="profile-logout">
        <button
          onClick={async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Error signing out:', error);
              }
            } catch (e) {
              console.error('Unexpected error during sign out:', e);
            } finally {
              navigateTo('login');
            }
          }}
          className="profile-logout-button"
        >
          <LogOut className="w-4 h-4" />
          Odjavi se
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
