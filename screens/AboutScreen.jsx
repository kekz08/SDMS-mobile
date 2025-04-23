import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../styles/styles';

export default function AboutScreen() {
  const navigation = useNavigation();

  const features = [
    {
      icon: 'school-outline',
      title: 'Scholarship Management',
      description: 'Comprehensive tools for managing various scholarship programs'
    },
    {
      icon: 'document-text-outline',
      title: 'Application Processing',
      description: 'Streamlined application review and approval workflow'
    },
    {
      icon: 'people-outline',
      title: 'Student Support',
      description: 'Dedicated portal for student needs and inquiries'
    },
    {
      icon: 'analytics-outline',
      title: 'Reporting',
      description: 'Detailed analytics and reporting capabilities'
    }
  ];

  const teamMembers = [
    {
      name: 'Dr. Haidee G. Lisondra',
      role: 'Program Director',
      image: require('../assets/team1.jpg')
    },
    {
      name: 'Johanna Marie B. Alipao',
      role: 'Technical Lead',
      image: require('../assets/team2.jpg')
    },
    {
      name: 'Ara Tricia Manto',
      role: 'Student Coordinator',
      image: require('../assets/team3.jpg')
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
            <Text style={styles.title}>About SDMS</Text>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Our Mission</Text>
            <Text style={styles.aboutText}>
              SDMS is a centralized platform designed to simplify the management of scholarships, 
              applications, and student data. We aim to connect deserving students with the 
              opportunities they need to excel in their academic journeys.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Ionicons name={feature.icon} size={28} color="#FFA000" style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Team</Text>
            <View style={styles.teamContainer}>
              {teamMembers.map((member, index) => (
                <View key={index} style={styles.teamCard}>
                  <Image source={member.image} style={styles.teamImage} />
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Contact Us</Text>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="white" />
              <Text style={styles.contactText}>info@sdms.edu</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="white" />
              <Text style={styles.contactText}>(063) 221-4051</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="white" />
              <Text style={styles.contactText}>San Francisco, Surigao del Norte</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  ...commonStyles,
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  aboutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 15,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  teamImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFA000',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 3,
  },
  teamRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: 'rgba(255, 160, 0, 0.2)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 0, 0.5)',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: 'white',
    marginLeft: 10,
  },
};