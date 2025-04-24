import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { commonStyles } from '../styles/styles';

const { width } = Dimensions.get('window');

const testimonials = [
  {
    name: 'Tricia Manto',
    quote: 'I highly recommend SDMS to anyone looking for scholarships! The platform made it so easy to find and apply for opportunities.',
    image: require('../assets/tricia.jpg'),
    role: 'Computer Science Scholar'
  },
  {
    name: 'Johanna Marie B. Alipao',
    quote: 'The application process was smooth and hassle-free, thanks to SDMS. I received my scholarship approval within just 2 weeks!',
    image: require('../assets/johanna.jpg'),
    role: 'Engineering Scholar'
  },
  {
    name: 'Haidee G. Lisondra',
    quote: 'SDMS has been a game-changer in helping me find the right scholarship. Their personalized recommendations saved me hours of research.',
    image: require('../assets/haidee.jpg'),
    role: 'Education Scholar'
  },
];

export default function TestimonialScreen() {
  const navigation = useNavigation();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animation for testimonial transition
  const animateTestimonialChange = (newIndex) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start();
    setTestimonialIndex(newIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      animateTestimonialChange((testimonialIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonialIndex]);

  const goToPrev = () => {
    animateTestimonialChange((testimonialIndex - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    animateTestimonialChange((testimonialIndex + 1) % testimonials.length);
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#005500', '#007000', '#009000']} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
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

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.testimonialBox,
            { 
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <Image 
            source={testimonials[testimonialIndex].image} 
            style={styles.profileImage} 
          />
          <Text style={styles.clientSays}>What Our Scholars Say</Text>
          <Text style={styles.quote}>&quot;{testimonials[testimonialIndex].quote}&quot;</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.name}>{testimonials[testimonialIndex].name}</Text>
            <Text style={styles.role}>{testimonials[testimonialIndex].role}</Text>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={goToPrev} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.dotsContainer}>
            {testimonials.map((_, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => animateTestimonialChange(index)}
                style={[
                  styles.dot,
                  index === testimonialIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity onPress={goToNext} style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  testimonialBox: {
    backgroundColor: 'rgba(0, 77, 0, 0.8)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 15,
  },
  clientSays: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  quote: {
    fontStyle: 'italic',
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  clientInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  arrowButton: {
    padding: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginRight: 8 },
  logo: { width: 40, height: 40 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
});