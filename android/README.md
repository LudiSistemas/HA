# Weather Station Android App

Native Android application for displaying Home Assistant sensor data with a cyberpunk-inspired design, matching the web interface functionality.

## Features

- Real-time weather data display
- Material Design 3 with dynamic theming
- Interactive weather charts
- Wind compass visualization
- Auto-refresh every minute
- Offline caching
- Dark mode support

## Development Setup

1. Requirements:
   - Android Studio Hedgehog (2023.1.1) or newer
   - JDK 17
   - Android SDK 34 (minimum SDK 24)

2. Clone the repository and open in Android Studio:
```bash
git clone <your-repo>
cd android/WeatherStation
```

3. Create `local.properties` in the project root:
```properties
sdk.dir=/path/to/your/Android/Sdk
BACKEND_URL=https://your-api-domain.com
```

4. Sync project with Gradle files

## Building the App

### Debug Build
```bash
./gradlew assembleDebug
```
The APK will be in `app/build/outputs/apk/debug/`

### Release Build
1. Create a keystore file:
```bash
keytool -genkey -v -keystore weather-release.keystore -alias weather -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `keystore.properties`:
```properties
storeFile=../weather-release.keystore
storePassword=your_store_password
keyAlias=weather
keyPassword=your_key_password
```

3. Build release APK:
```bash
./gradlew assembleRelease
```
The APK will be in `app/build/outputs/apk/release/`

## Project Structure

```
WeatherStation/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/weatherstation/
│   │   │   │   ├── data/
│   │   │   │   ├── di/
│   │   │   │   ├── domain/
│   │   │   │   ├── presentation/
│   │   │   │   └── util/
│   │   │   └── res/
│   │   └── test/
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
└── settings.gradle
```

## Architecture

- MVVM architecture
- Clean Architecture principles
- Jetpack Compose for UI
- Kotlin Coroutines for async operations
- Hilt for dependency injection
- Room for offline caching
- Retrofit for network calls 