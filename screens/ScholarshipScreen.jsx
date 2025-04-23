import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const scholarships = [
  {
    id: '1',
    title: 'Academic Excellence Scholarship',
    description: 'For students with outstanding academic performance.',
    fullDescription: 'This scholarship is awarded to students who maintain a GWA of 1.5 or better with no failing grades. Recipients will receive full tuition coverage and a monthly stipend for books and supplies.',
    deadline: 'June 15, 2023',
    benefits: 'Full tuition + Monthly stipend',
    requirements: 'GWA of 1.5 or better, No failing grades'
  },
  {
    id: '2',
    title: 'Financial Assistance Grant',
    description: 'For students from low-income families.',
    fullDescription: 'Designed to support students whose family income falls below 20,000 pesos per month. This grant covers 50-100% of tuition fees depending on financial need assessment.',
    deadline: 'July 1, 2023',
    benefits: '50-100% tuition coverage',
    requirements: 'Family income below 20,000/month, Barangay certification'
  },
  {
    id: '3',
    title: 'Special Talent Scholarship',
    description: 'For students excelling in sports or arts.',
    fullDescription: 'Available for students who have represented their school or region in sports, music, or arts competitions. Requires proof of competition participation and recommendation from coach/instructor.',
    deadline: 'June 30, 2023',
    benefits: 'Partial tuition + Training support',
    requirements: 'Proof of competition participation'
  },
];

const ScholarshipScreen = () => {
  const navigation = useNavigation();
  const [selectedScholarship, setSelectedScholarship] = useState(null);

  const renderScholarshipItem = ({ item }) => (
    <View style={styles.scholarshipCard}>
      <Text style={styles.scholarshipTitle}>{item.title}</Text>
      <Text style={styles.scholarshipDescription}>{item.description}</Text>
      <View style={styles.deadlineContainer}>
        <Ionicons name="time-outline" size={16} color="white" />
        <Text style={styles.deadlineText}>Deadline: {item.deadline}</Text>
      </View>
      <TouchableOpacity 
        style={styles.viewMoreButton}
        onPress={() => setSelectedScholarship(item)}
      >
        <Text style={styles.viewMoreText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderScholarshipDetail = () => (
    <View style={styles.detailContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setSelectedScholarship(null)}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backText}>Back to List</Text>
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Text style={styles.detailTitle}>{selectedScholarship.title}</Text>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{selectedScholarship.fullDescription}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <Text style={styles.sectionText}>{selectedScholarship.benefits}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <Text style={styles.sectionText}>{selectedScholarship.requirements}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Application Deadline</Text>
          <Text style={styles.sectionText}>{selectedScholarship.deadline}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => navigation.navigate('Registration')}
        >
          <LinearGradient 
            colors={['#FFD700', '#FFC107']} 
            style={styles.gradientButton}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Available Scholarships</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      {selectedScholarship ? (
        renderScholarshipDetail()
      ) : (
        <FlatList
          data={scholarships}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={renderScholarshipItem}
        />
      )}
    </View>
  );
};

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
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginRight: 8 },
  logo: { width: 40, height: 40 },
  listContainer: { padding: 20 },
  scholarshipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  scholarshipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scholarshipDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deadlineText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 13,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
  },
  viewMoreText: {
    color: '#FFA000',
    fontWeight: 'bold',
    marginRight: 5,
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  backText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 16,
  },
  detailContent: {
    paddingBottom: 30,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA000',
    marginBottom: 5,
  },
  sectionText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  applyButton: {
    marginTop: 30,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ScholarshipScreen;