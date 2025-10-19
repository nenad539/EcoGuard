# EcoGuard Project Structure

## Overview
This React application has been reorganized into a clean, maintainable structure with separation of concerns. All Tailwind CSS classes have been extracted into dedicated CSS files organized by component/screen.

## Project Structure

```
src/
├── App.tsx                     # Main application component
├── main.tsx                   # Application entry point
├── components/
│   ├── common/                # Shared components
│   │   ├── index.ts          # Common component exports
│   │   ├── BottomNav.tsx     # Navigation component
│   │   └── ImageWithFallback.tsx
│   └── ui/                   # UI library components (Radix UI based)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── screens/                   # Application screens
│   ├── index.ts              # Screen exports
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ChallengesScreen.tsx
│   ├── StatisticsScreen.tsx
│   ├── CommunityScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── NotificationsScreen.tsx
│   └── EcoTipsScreen.tsx
├── styles/                   # CSS files (replaces Tailwind classes)
│   ├── globals.css          # Global styles
│   ├── index.css            # Base styles
│   ├── App.css              # App component styles
│   ├── BottomNav.css        # Bottom navigation styles
│   ├── SplashScreen.css     # Splash screen styles
│   ├── HomeScreen.css       # Home screen styles
│   ├── LoginScreen.css      # Login screen styles
│   └── ChallengesScreen.css # Challenges screen styles
└── utils/                   # Utility functions
    ├── utils.ts            # General utilities
    └── use-mobile.ts       # Mobile detection hook
```

## Key Changes Made

### 1. **Organized File Structure**
- **`src/screens/`**: All screen components (`*Screen.tsx` files)
- **`src/components/common/`**: Shared components used across multiple screens
- **`src/components/ui/`**: Radix UI-based component library
- **`src/styles/`**: All CSS files with extracted Tailwind styles
- **`src/utils/`**: Utility functions and custom hooks

### 2. **CSS Extraction**
- Removed all Tailwind CSS classes from TSX files
- Created dedicated CSS files for each screen and component
- Used semantic class names for better maintainability
- Preserved all visual styling and animations

### 3. **Import Path Updates**
- Updated all import statements to reflect new folder structure
- Added index files for easier imports
- Fixed relative import paths across all components

### 4. **CSS File Organization**
Each screen now has its own CSS file with well-organized styles:

- **Class naming convention**: `.component-name-element`
- **Responsive design**: Maintained using CSS media queries
- **Animations**: Preserved using CSS animations and transitions
- **Color scheme**: Consistent green eco-theme maintained

### 5. **Components Created CSS Files For**

| Component | CSS File | Description |
|-----------|----------|-------------|
| App | `App.css` | Main application container |
| SplashScreen | `SplashScreen.css` | Loading screen with animations |
| HomeScreen | `HomeScreen.css` | Dashboard with stats and activities |
| LoginScreen | `LoginScreen.css` | User authentication form |
| ChallengesScreen | `ChallengesScreen.css` | Environmental challenges list |
| BottomNav | `BottomNav.css` | Bottom navigation component |

## Benefits of New Structure

1. **Better Maintainability**: Clear separation of concerns
2. **Easier Debugging**: Styles are logically grouped by component
3. **Improved Reusability**: Components are properly organized
4. **Better Performance**: CSS files can be cached separately
5. **Cleaner Code**: No inline Tailwind classes cluttering TSX files
6. **Easier Collaboration**: Team members can find files more easily

## Usage

### Importing Screens
```typescript
import { HomeScreen, LoginScreen } from '../screens';
// or
import { HomeScreen } from '../screens/HomeScreen';
```

### Importing Common Components
```typescript
import { BottomNav } from '../components/common';
// or
import { BottomNav } from '../components/common/BottomNav';
```

### Importing UI Components
```typescript
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
```

### Adding Styles
Each component imports its corresponding CSS file:
```typescript
import '../styles/ComponentName.css';
```

## Development Notes

- All original functionality is preserved
- Visual appearance remains identical
- Animations and transitions are maintained
- Mobile responsiveness is preserved
- The eco-friendly green theme is consistent throughout

## Next Steps

- Consider creating more reusable component abstractions
- Add CSS variables for consistent theming
- Implement CSS modules for better scoping if needed
- Consider adding a design system documentation