import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { commonStyles } from '../styles/styles';
import { BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function TestimonialScreen() {
  const navigation = useNavigation();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('TestimonialsScreen - Using BASE_URL:', BASE_URL);
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching ratings from:', `${BASE_URL}/api/ratings`);
      const response = await fetch(`${BASE_URL}/api/ratings`, {
        method: 'GET',
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch ratings: ${response.status} ${response.statusText}`);
      }
      
      const ratings = await response.json();
      console.log('Received ratings:', ratings);
      
      if (ratings && ratings.length > 0) {
        console.log('Raw ratings data:', ratings);
        // Transform the ratings data to match the testimonial format
        const formattedTestimonials = ratings.map(rating => {
          console.log('Processing rating:', rating);
          
          // Handle the image source
          let imageSource;
          if (rating.profileImage) {
            imageSource = { uri: rating.profileImage };
            console.log('Using image source:', imageSource);
          } else {
            console.log('No profile image, using placeholder');
            imageSource = require('../assets/profile-placeholder.png');
          }
          
          return {
            name: rating.user_name || 'Anonymous',
            quote: rating.comment || 'No comment provided',
            image: imageSource,
            role: rating.user_role || 'User',
            rating: rating.rating || 5
          };
        });

        console.log('Formatted testimonials:', formattedTestimonials);
        setTestimonials(formattedTestimonials);
      } else {
        console.log('No ratings data available');
        setTestimonials([]);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setError(`Failed to load testimonials: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation for testimonial transition
  const animateTestimonialChange = (newIndex) => {
    if (testimonials.length === 0) return;

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
    if (testimonials.length > 0) {
      const interval = setInterval(() => {
        animateTestimonialChange((testimonialIndex + 1) % testimonials.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [testimonialIndex, testimonials.length]);

  const goToPrev = () => {
    if (testimonials.length > 0) {
      animateTestimonialChange((testimonialIndex - 1 + testimonials.length) % testimonials.length);
    }
  };

  const goToNext = () => {
    if (testimonials.length > 0) {
      animateTestimonialChange((testimonialIndex + 1) % testimonials.length);
    }
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#FFD700' : '#FFFFFF'}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading testimonials...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#FFFFFF" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTestimonials}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (testimonials.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="chatbubble-outline" size={48} color="#FFFFFF" />
        <Text style={styles.errorText}>No testimonials available yet.</Text>
        <Text style={styles.subText}>Be the first to share your experience!</Text>
      </View>
    );
  }

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
            resizeMode="cover"
            onError={(error) => {
              console.error('Image loading error:', error.nativeEvent);
              console.log('Failed image source:', testimonials[testimonialIndex].image);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', testimonials[testimonialIndex].image);
            }}
          />
          <Text style={styles.clientSays}>What Our Scholars Say</Text>
          {renderStars(testimonials[testimonialIndex].rating)}
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
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  star: {
    marginHorizontal: 2,
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
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: 'white', 
    marginRight: 8 
  },
  logo: { 
    width: 40, 
    height: 40 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  subText: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
});