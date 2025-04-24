import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-swiper';

const { width: screenWidth } = Dimensions.get('window');

export default function LandingPage() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const images = [
    { 
      source: require('../assets/graduation1.jpeg'),
      caption: 'Achieve Your Academic Dreams'
    },
    { 
      source: require('../assets/graduation2.jpeg'),
      caption: 'Financial Support for Your Journey'
    },
    { 
      source: require('../assets/graduation3.jpg'),
      caption: 'Connecting Students with Opportunities'
    },
  ];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>SDMS</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <Swiper
          autoplay
          autoplayTimeout={5}
          showsPagination={true}
          dotStyle={styles.dotStyle}
          activeDotStyle={styles.activeDotStyle}
          paginationStyle={styles.paginationStyle}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.slide}>
              <Image source={image.source} style={styles.banner} />
              <Text style={styles.imageCaption}>{image.caption}</Text>
            </View>
          ))}
        </Swiper>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Scholarship Data Management System</Text>
        <Text style={styles.description}>
          Empowering Education Through Streamlined Scholarship Management
        </Text>

        <View style={styles.buttons}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={() => navigation.navigate('Registration')}
            >
              <LinearGradient 
                colors={['#FFD700', '#FFC107']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>Apply Now</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.btnIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity 
            style={styles.inquireBtn}
            onPress={() => navigation.navigate('Scholarship')}
          >
            <LinearGradient 
              colors={['#8A2BE2', '#6A0DAD']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Explore Scholarships</Text>
              <Ionicons name="search" size={20} color="white" style={styles.btnIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.scrollIndicator}
        onPress={() => {/* Scroll to next section if needed */}}
      >
        <Ionicons name="chevron-down" size={24} color="rgba(255,255,255,0.7)" />
        <Text style={styles.scrollText}>Learn More</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#008000',
  },
  gradient: { 
    ...StyleSheet.absoluteFillObject,
  },
  bgLogo: {
    position: 'absolute',
    width: '140%', 
    height: '85%',
    resizeMode: 'contain',
    opacity: 0.15,
    bottom: '8%',
    right: '-40%',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#00AA00',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: 'white', 
    marginRight: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logo: { 
    width: 45, 
    height: 45,
    borderRadius: 5,
  },
  carouselContainer: {
    height: 220,
    marginTop: 10,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: { 
    width: '94%', 
    height: '100%', 
    borderRadius: 15, 
    alignSelf: 'center',
  },
  imageCaption: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0, 85, 0, 0.7)',
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  dotStyle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 3,
  },
  activeDotStyle: {
    backgroundColor: '#FFD700',
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },
  paginationStyle: {
    bottom: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center', 
    marginBottom: 30, 
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  buttons: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 15,
    marginTop: 20,
  },
  applyBtn: { 
    borderRadius: 10, 
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  inquireBtn: { 
    borderRadius: 10, 
    overflow: 'hidden',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnGradient: { 
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16, 
    textAlign: 'center',
  },
  btnIcon: {
    marginLeft: 10,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
  },
  scrollText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
  },
});