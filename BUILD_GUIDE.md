# EcoRide Production APK Build Guide

## Prerequisites ✅
- EAS CLI installed: `npm install -g eas-cli`
- Logged into EAS account: `eas login`
- Project configured with EAS: `eas build:configure`

## Build Configuration

### EAS Configuration (eas.json)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### App Configuration (app.json)
- **Package Name**: `com.fankarwanta.rideapp`
- **Version**: 1.0.0
- **Version Code**: 1
- **Google Maps API Key**: Configured for both iOS and Android

## Building Production APK

### Step 1: Clean Build
```bash
cd /Users/fankarwanta/Desktop/ecoride_folder_3/client
npx eas build --platform android --profile production --clear-cache
```

### Step 2: Monitor Build
- Build will run on EAS servers
- Check progress at: https://expo.dev/accounts/fan_karwanta/projects/rideapp/builds
- Build typically takes 10-20 minutes

### Step 3: Download APK
Once build completes:
1. Download APK from EAS dashboard
2. Or use CLI: `npx eas build:download --platform android --profile production`

## Build Profiles

### Production (Recommended for Release)
```bash
npx eas build --platform android --profile production
```
- Optimized APK
- Release signing
- Production-ready

### Preview (For Testing)
```bash
npx eas build --platform android --profile preview
```
- Internal distribution
- Testing before production

### Development (For Debugging)
```bash
npx eas build --platform android --profile development
```
- Development client
- Debugging enabled

## Important Notes

### Google Maps Configuration
- API Key is configured in app.json
- Custom plugin at `./plugins/react-native-maps.js`
- Both iOS and Android configured

### Permissions Configured
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- INTERNET
- ACCESS_NETWORK_STATE

### App Features Included
- ✅ Real-time location tracking
- ✅ Google Maps integration
- ✅ Socket.io real-time communication
- ✅ Native maps with react-native-maps
- ✅ Rider and customer functionality
- ✅ Live tracking and navigation

## Troubleshooting

### Build Fails
1. Clear cache: `--clear-cache` flag
2. Check EAS dashboard for detailed logs
3. Verify all dependencies in package.json

### Maps Not Working
1. Verify Google Maps API key is valid
2. Enable required APIs in Google Cloud Console:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API

### Installation Issues
1. Enable "Install from Unknown Sources" on Android
2. Uninstall previous versions first
3. Check device has sufficient storage

## Post-Build Steps

### Testing the APK
1. Install on physical Android device
2. Test all features:
   - Login/Registration
   - Location permissions
   - Map display
   - Real-time tracking
   - Ride booking flow

### Distribution
1. **Internal Testing**: Share APK directly
2. **Google Play Store**: Use AAB format instead
   ```bash
   npx eas build --platform android --profile production
   # Change buildType to "aab" in eas.json
   ```

## Build Commands Reference

```bash
# Production APK (Current)
npx eas build --platform android --profile production

# Production AAB (for Play Store)
# First change buildType to "aab" in eas.json, then:
npx eas build --platform android --profile production

# Clear cache build
npx eas build --platform android --profile production --clear-cache

# Download latest build
npx eas build:download --platform android --profile production

# Check build status
npx eas build:list --platform android

# View build logs
npx eas build:view
```

## Environment Variables

If you need to add environment variables:
1. Create `.env` file in project root
2. Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "your-api-url"
      }
    }
  }
}
```

## Success Checklist

Before releasing:
- [ ] Test on multiple Android devices
- [ ] Verify all permissions work
- [ ] Test location tracking
- [ ] Verify maps display correctly
- [ ] Test ride booking flow
- [ ] Check socket connections
- [ ] Verify API connectivity
- [ ] Test both rider and customer flows

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Build Dashboard: https://expo.dev/accounts/fan_karwanta/projects/rideapp/builds
- Expo Forums: https://forums.expo.dev/
