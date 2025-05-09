import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FeatureDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const feature = params?.feature || {
    title: 'Feature',
    description: 'No description available',
    color: '#4CAF50'
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.bgLogo} 
          resizeMode="contain"
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feature Details</Text>
          <View style={{ width: 28 }} /> {/* Spacer */}
        </View>

        <View style={styles.contentContainer}>
          <View style={[styles.featureHeader, { backgroundColor: `${feature.color}20` }]}>
            <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
              <Ionicons name={feature.icon || 'help-circle-outline'} size={32} color="white" />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionText}>{feature.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Key Benefits</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Streamlines administrative processes</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Reduces manual paperwork by 80%</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Provides real-time tracking and updates</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <Text style={styles.sectionText}>
              Our system automates the entire scholarship lifecycle from application to disbursement.
              Administrators can configure criteria while students enjoy a seamless application experience.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => Linking.openURL('mailto:support@sdms.edu')}
          >
            <Text style={styles.ctaButtonText}>Request Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#008000' },
  gradient: { ...StyleSheet.absoluteFillObject },
  bgLogo: {
    position: 'absolute',
    width: '140%',
    height: '85%',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  detailSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA000',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 15,
    color: 'white',
    marginLeft: 10,
  },
  ctaButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
};