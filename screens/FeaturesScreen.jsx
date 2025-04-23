import { View,StyleSheet, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FeatureScreen() {
  const navigation = useNavigation();

  const features = [
    {
      icon: 'layers-outline',
      title: 'Centralized Management',
      description: 'Manage all scholarships, applications, and student data from one intuitive dashboard with advanced filtering and search capabilities.',
      color: '#4CAF50'
    },
    {
      icon: 'document-text-outline',
      title: 'Streamlined Applications',
      description: 'Students enjoy a simplified application process with step-by-step guidance and real-time status updates.',
      color: '#2196F3'
    },
    {
      icon: 'analytics-outline',
      title: 'Data Analytics',
      description: 'Generate comprehensive reports and visualizations to track scholarship distribution and student performance metrics.',
      color: '#9C27B0'
    },
    {
      icon: 'notifications-outline',
      title: 'Automated Alerts',
      description: 'Automated notifications for application deadlines, approval statuses, and important announcements.',
      color: '#FF9800'
    },
    {
      icon: 'people-outline',
      title: 'Student Portal',
      description: 'Personalized dashboard for students to manage their applications, documents, and scholarship benefits.',
      color: '#E91E63'
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Secure Platform',
      description: 'Enterprise-grade security with role-based access control to protect sensitive student information.',
      color: '#607D8B'
    }
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>System Features</Text>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
          </View>
        </View>

        <Text style={styles.heading}>Powerful Features for Scholarship Management</Text>
        <Text style={styles.subheading}>Everything you need to streamline scholarship administration</Text>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { borderLeftColor: feature.color }]}>
              <View style={styles.featureHeader}>
                <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon} size={24} color="white" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <TouchableOpacity 
                style={styles.learnMoreButton}
                onPress={() => navigation.navigate('FeatureDetail', { feature })}
              >
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Ionicons name="chevron-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Ready to transform your scholarship management?</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.ctaButtonText}>Get Started Today</Text>
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
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 25,
    marginHorizontal: 30,
  },
  featuresContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 15,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  learnMoreText: {
    color: '#FFA000',
    fontWeight: 'bold',
    marginRight: 5,
  },
  ctaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  ctaText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  ctaButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
};