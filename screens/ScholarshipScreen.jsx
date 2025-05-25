import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, Animated, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const scholarships = [
  {
    id: '1',
    title: 'Academic Excellence Scholarship',
    description: 'For students with outstanding academic performance',
    fullDescription: 'This prestigious scholarship rewards academic achievers who maintain a GWA of 1.5 or better with no failing grades. Recipients receive full tuition coverage plus a monthly stipend for books and supplies. Additional benefits include priority registration and access to exclusive academic workshops.',
    deadline: 'June 15, 2025',
    benefits: [
      'Full tuition coverage',
      'Monthly stipend (₱3,000)',
      'Priority registration',
      'Academic workshop access'
    ],
    requirements: [
      'Current GWA of 1.5 or better',
      'No failing grades in any subject',
      'Recommendation letter from 2 professors',
      'Certified true copy of grades'
    ],
    icon: 'school'
  },
  {
    id: '2',
    title: 'Financial Assistance Grant',
    description: 'Support for students from low-income families',
    fullDescription: 'This need-based grant helps students from economically challenged backgrounds. After thorough financial assessment, recipients receive 50-100% tuition coverage. Special consideration given to working students and those supporting their families.',
    deadline: 'July 1, 2025',
    benefits: [
      '50-100% tuition coverage',
      'Possible transportation allowance',
      'Work-study opportunities'
    ],
    requirements: [
      'Family income below ₱20,000/month',
      'Barangay certification of indigency',
      'Latest ITR of parents/guardian',
      'Personal statement of need'
    ],
    icon: 'attach-money'
  },
  {
    id: '3',
    title: 'Special Talent Scholarship',
    description: 'For exceptional athletes and artists',
    fullDescription: 'Designed for students who excel in sports, music, or visual/performing arts. Recipients receive partial tuition coverage plus specialized training support. Must maintain satisfactory academic progress while representing the university in competitions.',
    deadline: 'June 30, 2025',
    benefits: [
      'Partial tuition coverage (up to 70%)',
      'Specialized training support',
      'Competition travel funding',
      'Access to premium facilities'
    ],
    requirements: [
      'Proof of competition participation (regional/national level)',
      'Recommendation from coach/instructor',
      'Portfolio or performance recordings',
      'Commitment to university representation'
    ],
    icon: 'stars'
  },
];

const ScholarshipScreen = () => {
  const navigation = useNavigation();
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      console.log('Fetching scholarships from:', API_URL);
      
      const response = await fetch(`${API_URL}/scholarships`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received scholarships:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Transform the data to match the frontend structure
      const transformedScholarships = data.map(scholarship => ({
        id: scholarship.id.toString(),
        title: scholarship.name,
        description: scholarship.description.split('.')[0], // First sentence as short description
        fullDescription: scholarship.description,
        deadline: new Date(scholarship.deadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        benefits: scholarship.criteria ? scholarship.criteria.split('\n').filter(Boolean) : [],
        requirements: scholarship.requirements.split('\n').filter(Boolean),
        icon: getIconForScholarship(scholarship.name),
        amount: scholarship.amount,
        slots: scholarship.slots,
        status: scholarship.status
      }));

      setScholarships(transformedScholarships);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      let errorMessage = 'Failed to load scholarships. ';
      
      if (error.message.includes('Network request failed')) {
        errorMessage += 'Please check your internet connection and ensure the server is running.';
      } else if (error.message.includes('Invalid data format')) {
        errorMessage += 'Server returned invalid data format.';
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => fetchScholarships()
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getIconForScholarship = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('academic') || lowerName.includes('excellence')) {
      return 'school';
    } else if (lowerName.includes('financial') || lowerName.includes('assistance')) {
      return 'attach-money';
    } else if (lowerName.includes('talent') || lowerName.includes('special')) {
      return 'stars';
    }
    return 'school'; // default icon
  };

  const handleCardPress = (item) => {
    setSelectedScholarship(item);
    fadeAnim.setValue(0);
    slideAnim.setValue(width);
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
    ]).start();
  };

  const handleBackPress = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => setSelectedScholarship(null));
  };

  const renderScholarshipItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.scholarshipCard}
      activeOpacity={0.8}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.cardHeader}>
        <MaterialIcons name={item.icon} size={30} color="#FFA000" style={styles.cardIcon} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.scholarshipTitle}>{item.title}</Text>
          <Text style={styles.scholarshipDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.deadlineContainer}>
        <Ionicons name="time-outline" size={18} color="white" />
        <Text style={styles.deadlineText}>Deadline: {item.deadline}</Text>
      </View>
      <View style={styles.viewMoreContainer}>
        <Text style={styles.viewMoreText}>View Details</Text>
        <Ionicons name="chevron-forward" size={20} color="#FFA000" />
      </View>
    </TouchableOpacity>
  );

  const renderBulletList = (items) => (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderScholarshipDetail = () => (
    <Animated.View 
      style={[
        styles.detailContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }] 
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={handleBackPress}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backText}>Back to Scholarships</Text>
      </TouchableOpacity>
      
      <ScrollView 
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHeader}>
          <MaterialIcons 
            name={selectedScholarship.icon} 
            size={45} 
            color="#FFA000" 
            style={styles.detailIcon} 
          />
          <Text style={styles.detailTitle}>{selectedScholarship.title}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>STATUS</Text>
          <View style={[styles.statusIndicator, selectedScholarship.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{selectedScholarship.status}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <Text style={styles.sectionText}>{selectedScholarship.fullDescription}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>BENEFITS</Text>
          {renderBulletList(selectedScholarship.benefits)}
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>REQUIREMENTS</Text>
          {renderBulletList(selectedScholarship.requirements)}
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>APPLICATION DEADLINE</Text>
          <View style={styles.deadlineHighlight}>
            <Ionicons name="calendar" size={20} color="#FFA000" />
            <Text style={styles.deadlineDate}>{selectedScholarship.deadline}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.applyButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EducationalAids')}
        >
          <LinearGradient 
            colors={['#FFD700', '#FFC107']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.applyButtonText}>APPLY NOW</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#005500', '#007000', '#009000']} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.bgLogo} 
        resizeMode="contain"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>SDMS</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      {!selectedScholarship && !loading && scholarships.length > 0 && (
        <View style={styles.pageHeaderContainer}>
          <Text style={styles.pageHeaderTitle}>Available Scholarships</Text>
        </View>
      )}

      {selectedScholarship ? (
        renderScholarshipDetail()
      ) : (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading scholarships...</Text>
          </View>
        ) : (
          <FlatList
            data={scholarships}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={renderScholarshipItem}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#008000' 
  },
  gradient: { 
    ...StyleSheet.absoluteFillObject 
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
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 170, 0, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white', 
    marginRight: 10 
  },
  logo: { 
    width: 36, 
    height: 36 
  },
  listContainer: { 
    padding: 20 
  },
  scholarshipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  scholarshipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scholarshipDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 77, 0, 0.6)',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  deadlineText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  viewMoreText: {
    color: '#FFA000',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 15,
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingRight: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '500',
  },
  detailContent: {
    paddingBottom: 40,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 15,
  },
  detailIcon: {
    marginRight: 20,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    lineHeight: 32,
  },
  detailSection: {
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFA000',
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#FFA000',
    marginRight: 12,
    fontSize: 18,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  deadlineHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 77, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  deadlineDate: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
  },
  applyButton: {
    marginTop: 40,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  gradientButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 18,
  },
  pageHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
  },
  pageHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  statusIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default ScholarshipScreen;