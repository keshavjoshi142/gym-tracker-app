# GymTracker - React Native Fitness App

A comprehensive fitness tracking application built with React Native and Expo, featuring both client-side storage and optional backend server integration.

## 🏋️ Features

- **Workout Tracking**: Create and manage detailed workout sessions
- **Exercise Library**: Comprehensive database of exercises with categories and muscle groups
- **Progress Visualization**: Interactive charts showing performance trends
- **Personal Records**: Automatic tracking of maximum weight, reps, and volume
- **Dual Storage**: Client-side AsyncStorage with optional server backend
- **Material Design**: Clean, modern UI using react-native-paper components
- **Type-Safe**: Built with TypeScript for enhanced development experience

## 📱 Screenshots

*Coming soon - add screenshots of your app here*

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gymtracker.git
   cd gymtracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your preferred platform**
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## 🛠️ Backend Setup (Optional)

The app includes an optional Node.js backend with SQLite database for persistent storage across devices.

### Start the Backend Server

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001` by default.

### Enable API Integration

To use the backend server instead of local storage:

1. Open `src/utils/storage.ts`
2. Change `USE_API = false` to `USE_API = true`
3. Ensure the backend server is running

## 🏗️ Project Structure

```
src/
├── screens/           # All screen components
│   ├── HomeScreen.tsx
│   ├── WorkoutsScreen.tsx
│   ├── ExercisesScreen.tsx
│   ├── ProgressScreen.tsx
│   ├── WorkoutDetailScreen.tsx
│   ├── ExerciseDetailScreen.tsx
│   └── AddExerciseScreen.tsx
├── types/            # TypeScript interfaces
│   └── index.ts
├── data/             # Static data (exercise definitions)
│   └── exercises.ts
└── utils/            # Helper functions and services
    ├── storage.ts    # Data persistence layer
    ├── api.ts        # Backend API service
    └── helpers.ts    # Utility functions

server/
├── app.js           # Express server setup
├── database/
│   └── db.js        # SQLite database operations
└── routes/          # API route definitions
```

## 💾 Data Models

### Core Entities

- **Exercise**: Base exercise definition with categories and muscle groups
- **Workout**: Contains exercises, sets, and metadata for a training session
- **WorkoutSet**: Individual set with weight, reps, and notes
- **PersonalRecord**: Automatically calculated maximums per exercise

### Storage Options

1. **Local Storage** (Default): Uses AsyncStorage for client-side persistence
2. **Server Storage**: RESTful API with SQLite database backend

## 🎨 UI/UX Features

- **Material Design**: Consistent styling with react-native-paper
- **Smooth Animations**: Custom animations for workout completion and navigation
- **Interactive Charts**: Touch-enabled progress visualization with detailed breakdowns
- **Responsive Layout**: Optimized for various screen sizes
- **Dark/Light Theme**: Automatic theme support (if implemented)

## 📊 Progress Tracking

The app automatically calculates and displays:

- **Personal Records**: Maximum weight, reps, and volume per exercise
- **Progress Charts**: Visual representation of performance over time
- **Workout Statistics**: Sets, total volume, and average weights per session
- **Historical Data**: Complete workout history with filtering options

## 🔧 Development

### Key Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and build tool
- **TypeScript**: Type-safe JavaScript
- **react-native-paper**: Material Design components
- **react-native-chart-kit**: Data visualization
- **AsyncStorage**: Client-side storage
- **Express.js**: Backend API server
- **SQLite**: Database for persistent storage

### Code Style

- **TypeScript Strict Mode**: Enhanced type safety
- **Path Aliases**: Use `@/` for clean imports
- **Component Structure**: Consistent patterns across all screens
- **Error Handling**: Comprehensive try-catch blocks for async operations

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/gymtracker/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🔮 Future Enhancements

- [ ] User authentication and cloud sync
- [ ] Social features and workout sharing
- [ ] Advanced analytics and insights
- [ ] Workout templates and programs
- [ ] Exercise instruction videos
- [ ] Nutrition tracking integration
- [ ] Wearable device integration

---

**Happy Training! 🏋️‍♂️💪**