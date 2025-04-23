import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent({ onFinish }) {
  const fadeAnim = new Animated.Value(0); // Animation for fading in

  useEffect(() => {
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Hide splash screen after 4 seconds
    setTimeout(() => {
      onFinish();
      SplashScreen.hideAsync();
    }, 4000);
  }, []);

  return (
    <LinearGradient colors={['#004d00', '#007A33', '#00b33c']} style={styles.splashContainer}>
      {/* Background Logo */}
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      {/* Animated SDMS Logo */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image source={require('../assets/logo.png')} style={styles.sdmsLogo} />
      </Animated.View>

      {/* Animated Title */}
      <Animated.Text style={[styles.splashText, { opacity: fadeAnim }]}>SDMS</Animated.Text>

      {/* Animated Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        Unlock Your Future with the Perfect Scholarship
      </Animated.Text>
    </LinearGradient>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgLogo: {
    position: 'absolute',
    width: '140%',
    height: '90%',
    resizeMode: 'contain',
    opacity: 0.15,
    bottom: '5%',
    right: '-40%',
  },
  sdmsLogo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 10 },
  splashText: { fontSize: 40, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'white', textAlign: 'center', marginTop: 10, width: '80%' },
});
