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


  const getUserStreak = async () => {
    const userId = await getUserId();
    if (!userId) return '0';
    let { data: korisnik_profil, error } = await supabase
      .from('korisnik_profil')
      .select('dnevna_serija')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return '0';
    }
    
  return korisnik_profil?.dnevna_serija || '0';
  };
  const [userStreak, setUserStreak] = useState('');
  useEffect(() => {
    getUserStreak().then(dnevna_serija => setUserStreak(dnevna_serija));
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




  const achievements = [
    { id: 1, title: 'Prvi koraci', description: 'Završi prvi izazov', icon: <svg xmlns="http://www.w3.org/2000/svg" width={38} height={38} viewBox="0 0 2048 2048"><path fill="#2bc154" d="M1024 640q-80 0-149 30t-122 82t-83 123t-30 149q0 80 30 149t82 122t122 83t150 30q79 0 149-30t122-82t83-122t30-150q0-64-22-128h134q8 32 12 64t4 64q0 106-40 199t-110 162t-163 110t-199 41t-199-40t-162-110t-110-163t-40-199q0-106 40-199t109-162t163-110t199-41q32 0 64 4t64 12v134q-64-22-128-22m866 155q30 113 30 229q0 123-32 237t-90 214t-141 182t-181 140t-214 91t-238 32q-123 0-237-32t-214-90t-182-141t-140-181t-91-214t-32-238q0-123 32-237t90-214t141-182t181-140t214-91t238-32q116 0 229 30l-101 101v8q-32-5-64-8t-64-3q-106 0-204 27t-183 78t-156 120t-120 155t-77 184t-28 204t27 204t78 183t120 156t155 120t184 77t204 28t204-27t183-78t156-120t120-155t77-184t28-204q0-32-3-64t-8-64h8zm-610-118V390L1664 6v378h378l-384 384h-287l-223 223q4 15 4 33q0 27-10 50t-27 40t-41 28t-50 10q-27 0-50-10t-40-27t-28-41t-10-50q0-27 10-50t27-40t41-28t50-10q18 0 33 4zm128-37h197l128-128h-197V315l-128 128z"></path></svg>, unlocked: true },
    { id: 2, title: 'Eko ratnik', description: 'Završi 10 izazova', icon: <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 20 20"><g fill="#2bc154" fillRule="evenodd" clipRule="evenodd"><path d="M16.69 3.384a.5.5 0 0 0-.583-.581l-2.421.45a.5.5 0 0 0-.263.14L7.33 9.507a.5.5 0 0 0 .002.707l1.98 1.972a.5.5 0 0 0 .706-.001l6.093-6.116a.5.5 0 0 0 .138-.263zm-.766-1.564a1.5 1.5 0 0 1 1.75 1.743l-.441 2.424a1.5 1.5 0 0 1-.413.79l-6.093 6.115a1.5 1.5 0 0 1-2.122.004l-1.98-1.973a1.5 1.5 0 0 1-.003-2.12l6.093-6.117a1.5 1.5 0 0 1 .788-.416z"></path><path d="M7.954 11.57a.5.5 0 0 1-.001-.707l3.383-3.397a.5.5 0 1 1 .709.706L8.66 11.57a.5.5 0 0 1-.707 0"></path><path d="M3.542 9.176a1.94 1.94 0 0 1 2.741-.005l4.076 4.06a1.938 1.938 0 0 1-2.736 2.747l-4.076-4.06a1.94 1.94 0 0 1-.005-2.742m2.036.703a.938.938 0 1 0-1.325 1.33l4.076 4.06a.938.938 0 1 0 1.324-1.329z"></path><path d="M5.307 12.96L2.63 15.648a.5.5 0 0 0 .002.707l.62.619a.5.5 0 0 0 .708-.002l2.678-2.688l.708.706l-2.678 2.688a1.5 1.5 0 0 1-2.121.004l-.621-.619a1.5 1.5 0 0 1-.004-2.12L4.6 12.254zM3.31 3.384a.5.5 0 0 1 .583-.581l2.421.45a.5.5 0 0 1 .263.14l3.29 3.301l.708-.706l-3.29-3.302a1.5 1.5 0 0 0-.788-.416l-2.421-.45a1.5 1.5 0 0 0-1.75 1.743l.441 2.424a1.5 1.5 0 0 0 .413.79l3.29 3.301l.708-.706l-3.29-3.302a.5.5 0 0 1-.137-.263zm7.04 10.473l4.066-3.987a.944.944 0 0 1 1.327 1.343l-4.072 4.056a.94.94 0 0 1-1.327-.002l-.708.706c.755.758 1.983.76 2.74.005l4.073-4.057a1.944 1.944 0 0 0-2.734-2.765L9.65 13.143z"></path><path d="m14.693 12.96l2.678 2.688a.5.5 0 0 1-.002.707l-.62.619a.5.5 0 0 1-.708-.002l-2.678-2.688l-.708.706l2.678 2.688a1.5 1.5 0 0 0 2.121.004l.621-.619a1.5 1.5 0 0 0 .004-2.12l-2.678-2.689z"></path></g></svg>, unlocked: true },
    { id: 3, title: 'Prijatelj prirode', description: 'Posadi 5 stabala', icon: <svg xmlns="http://www.w3.org/2000/svg" width={384} height={512} viewBox="0 0 384 512"><path fill="#2bc154" d="M378.31 378.49L298.42 288h30.63c9.01 0 16.98-5 20.78-13.06c3.8-8.04 2.55-17.26-3.28-24.05L268.42 160h28.89c9.1 0 17.3-5.35 20.86-13.61c3.52-8.13 1.86-17.59-4.24-24.08L203.66 4.83c-6.03-6.45-17.28-6.45-23.32 0L70.06 122.31c-6.1 6.49-7.75 15.95-4.24 24.08C69.38 154.65 77.59 160 86.69 160h28.89l-78.14 90.91c-5.81 6.78-7.06 15.99-3.27 24.04C37.97 283 45.93 288 54.95 288h30.63L5.69 378.49c-6 6.79-7.36 16.09-3.56 24.26c3.75 8.05 12 13.25 21.01 13.25H160v24.45l-30.29 48.4c-5.32 10.64 2.42 23.16 14.31 23.16h95.96c11.89 0 19.63-12.52 14.31-23.16L224 440.45V416h136.86c9.01 0 17.26-5.2 21.01-13.25c3.8-8.17 2.44-17.47-3.56-24.26"></path></svg>, unlocked: true },
    { id: 4, title: 'Recikler', description: 'Recikliraj 100 predmeta', icon: <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#2bc154" d="m21.82 15.42l-2.5 4.33c-.49.86-1.4 1.31-2.32 1.25h-2v2l-2.5-4.5L15 14v2h2.82l-2.22-3.85l4.33-2.5l1.8 3.12c.52.77.59 1.8.09 2.65M9.21 3.06h5c.98 0 1.83.57 2.24 1.39l1 1.74l1.73-1l-2.64 4.41l-5.15.09l1.73-1l-1.41-2.45l-2.21 3.85l-4.34-2.5l1.8-3.12c.41-.83 1.26-1.41 2.25-1.41m-4.16 16.7l-2.5-4.33c-.49-.85-.42-1.87.09-2.64l1-1.73l-1.73-1l5.14.08l2.65 4.42l-1.73-1L6.56 16H11v5H7.4a2.51 2.51 0 0 1-2.35-1.24"></path></svg>, unlocked: true },
    { id: 5, title: 'Eko guru', description: 'Dostignite Level 10', icon: <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#2bc154" d="M12 4c1.11 0 2 .89 2 2s-.89 2-2 2s-2-.89-2-2s.9-2 2-2m9 12v-2c-2.24 0-4.16-.96-5.6-2.68l-1.34-1.6A1.98 1.98 0 0 0 12.53 9H11.5c-.61 0-1.17.26-1.55.72l-1.34 1.6C7.16 13.04 5.24 14 3 14v2c2.77 0 5.19-1.17 7-3.25V15l-3.88 1.55c-.67.27-1.12.95-1.12 1.66C5 19.2 5.8 20 6.79 20H9v-.5a2.5 2.5 0 0 1 2.5-2.5h3c.28 0 .5.22.5.5s-.22.5-.5.5h-3c-.83 0-1.5.67-1.5 1.5v.5h7.21c.99 0 1.79-.8 1.79-1.79c0-.71-.45-1.39-1.12-1.66L14 15v-2.25c1.81 2.08 4.23 3.25 7 3.25"></path></svg>, unlocked: false },
    { id: 6, title: 'Lider zajednice', description: 'Budi #1 na rang listi', icon: <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"><path fill="#2bc154" d="M6 20q-.425 0-.712-.288T5 19t.288-.712T6 18h12q.425 0 .713.288T19 19t-.288.713T18 20zm.7-3.5q-.725 0-1.287-.475t-.688-1.2l-1-6.35q-.05 0-.112.013T3.5 8.5q-.625 0-1.062-.437T2 7t.438-1.062T3.5 5.5t1.063.438T5 7q0 .175-.038.325t-.087.275L8 9l3.125-4.275q-.275-.2-.45-.525t-.175-.7q0-.625.438-1.063T12 2t1.063.438T13.5 3.5q0 .375-.175.7t-.45.525L16 9l3.125-1.4q-.05-.125-.088-.275T19 7q0-.625.438-1.063T20.5 5.5t1.063.438T22 7t-.437 1.063T20.5 8.5q-.05 0-.112-.012t-.113-.013l-1 6.35q-.125.725-.687 1.2T17.3 16.5z"></path></svg>, unlocked: false },
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
