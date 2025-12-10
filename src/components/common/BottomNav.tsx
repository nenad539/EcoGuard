import React, { useContext } from 'react';
import { NavigationContext, Screen } from '../../App';
import { Home, Camera, BarChart3, Users, Settings } from 'lucide-react';
import '../../styles/BottomNav.css';

export function BottomNav() {
  const { currentScreen, navigateTo } = useContext(NavigationContext);

  const navItems = [
    { screen: 'settings' as Screen, icon: Settings, label: 'Podešavanja' },
    { screen: 'photoChallenge' as Screen, icon: Camera, label: 'Izazovi' },
    { screen: 'home' as Screen, icon: Home, label: 'Početna' },
    { screen: 'statistics' as Screen, icon: BarChart3, label: 'Statistika' },
    { screen: 'profile' as Screen, icon: Users, label: 'Nalog' },
    
  ];

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map(({ screen, icon: Icon, label }) => (
          <button
            key={screen}
            onClick={() => navigateTo(screen)}
            className={`bottom-nav-item ${currentScreen === screen ? 'active' : 'inactive'}`}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
