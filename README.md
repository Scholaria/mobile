# Scholaria Mobile App

A React Native mobile application built with Expo for the Scholaria research platform.

## Tech Stack

- React Native
- Expo
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Expo Router (File-based routing)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac users) or Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Android Studio (for Android development)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Scholaria/mobile.git
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run:
   ```
   npx expo start 
   ```

## Development

To start the development server with the development client:

```bash
npx expo start --dev-client
```

This will start the Expo development server and provide you with several options:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with your phone (requires Expo Go app)

## Project Structure

```
mobile/
├── app/              # Main application code with file-based routing
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Reusable React components
├── constants/        # Application constants and configuration
├── lib/             # Utility functions and shared logic
├── scripts/         # Build and utility scripts
├── types/           # TypeScript type definitions
└── ...
```

## Available Scripts

- `npx expo start`: Start the Expo development server
- `npx expo start --dev-client`: Start with development client
- `npx expo start --ios`: Start in iOS simulator
- `npx expo start --android`: Start in Android emulator
- `npm run reset-project`: Reset the project to a blank state


## Development Tips

1. Use the Expo Go app for quick testing on physical devices
2. For development client features, use `npx expo start --dev-client`
3. The app uses file-based routing with Expo Router
4. Styling is done using NativeWind (Tailwind CSS for React Native)

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## Troubleshooting

If you encounter any issues:

1. Clear the Metro bundler cache:
   ```bash
   npx expo start --clear
   ```

2. Reset the development client:
   ```bash
   npx expo start --dev-client --clear
   ```

3. Check that all environment variables are properly set
4. Ensure you have the latest version of Expo CLI

## License

ISC 