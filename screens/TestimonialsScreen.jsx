import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { commonStyles } from '../styles/styles';

const testimonials = [
  {
    name: 'Tricia Manto',
    quote: 'I highly recommend SDMS to anyone looking for scholarships!',
    image: require('../assets/tricia.jpg'),
  },
  {
    name: 'Johanna Marie B. Alipao',
    quote: 'The application process was smooth and hassle-free, thanks to SDMS.',
    image: require('../assets/johanna.jpg'),
  },
  {
    name: 'Haidee G. Lisondra',
    quote: 'SDMS has been a game-changer in helping me find the right scholarship.',
    image: require('../assets/haidee.jpg'),
  },
];

export default function TestimonialScreen() {
  const navigation = useNavigation();
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Testimonials</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      <View style={styles.testimonialBox}>
        <Image source={testimonials[testimonialIndex].image} style={styles.profileImage} />
        <Text style={styles.clientSays}>Client Says?</Text>
        <Text style={styles.quote}>&quot;{testimonials[testimonialIndex].quote}&quot;</Text>
        <Text style={styles.name}>{testimonials[testimonialIndex].name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  testimonialBox: {
    backgroundColor: '#004d00',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'white',
  },
  clientSays: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  quote: {
    fontStyle: 'italic',
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
  },
  name: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
