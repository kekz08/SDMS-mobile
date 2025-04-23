import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingPage() {
  const navigation = useNavigation();

  const images = [
    require('../assets/graduation1.jpeg'),
    require('../assets/graduation2.jpeg'),
    require('../assets/graduation3.jpg'),
  ];

  const [currentImage, setCurrentImage] = useState(images[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(images[Math.floor(Math.random() * images.length)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
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

      <Image source={currentImage} style={styles.banner} />

      <Text style={styles.heading}>Scholarship Data Management System</Text>
      <Text style={styles.description}>
        Empowering Education Through Streamlined Scholarship Management
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.applyBtn}
          onPress={() => navigation.navigate('Registration')}
        >
          <LinearGradient colors={['#FFD700', '#FFC107']} style={styles.btnGradient}>
            <Text style={styles.btnText}>Apply Now</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inquireBtn}
        onPress={() => navigation.navigate('Scholarship')}>
          <LinearGradient colors={['#8A2BE2', '#6A0DAD']} style={styles.btnGradient}>
            <Text style={styles.btnText}>Inquire</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#008000' },
  gradient: { ...StyleSheet.absoluteFillObject },

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
  },

  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginRight: 8 },
  logo: { width: 45, height: 45 },

  banner: { 
    width: '94%', 
    height: 180, 
    marginVertical: 20, 
    borderRadius: 15, 
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  heading: { fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 5 },
  description: { fontSize: 15, color: 'white', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },

  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  applyBtn: { borderRadius: 8, overflow: 'hidden' },
  inquireBtn: { borderRadius: 8, overflow: 'hidden' },
  
  btnGradient: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});
