import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContactScreen() {
  const navigation = useNavigation();

  const contactMethods = [
    {
      icon: 'mail-outline',
      title: 'Email Us',
      description: 'For general inquiries and support',
      action: () => Linking.openURL('mailto:info@sdms.edu')
    },
    {
      icon: 'call-outline',
      title: 'Call Us',
      description: 'Monday-Friday, 8AM-5PM',
      action: () => Linking.openURL('tel:+639123456789')
    },
    {
      icon: 'location-outline',
      title: 'Visit Us',
      description: 'San Francisco, Surigao del Norte',
      action: () => Linking.openURL('https://maps.app.goo.gl/VHPygXaMjMo6WznWA')
    },
    {
      icon: 'calendar-outline',
      title: 'Schedule Meeting',
      description: 'Book a consultation with our team',
      action: () => Linking.openURL('https://calendly.com/sdms-team')
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
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={{ width: 28 }} /> {/* Spacer */}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.heading}>We'd Love to Hear From You</Text>
          <Text style={styles.subheading}>Choose your preferred contact method below</Text>

          {contactMethods.map((method, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.contactCard}
              onPress={method.action}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name={method.icon} size={24} color="#FFA000" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactDescription}>{method.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ))}

          <View style={styles.socialContainer}>
            <Text style={styles.socialTitle}>Connect With Us</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL('https://facebook.com/sdms')}
              >
                <Ionicons name="logo-facebook" size={28} color="#3b5998" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL('https://twitter.com/sdms')}
              >
                <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL('https://linkedin.com/company/sdms')}
              >
                <Ionicons name="logo-linkedin" size={28} color="#0077B5" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.faqContainer}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity 
              style={styles.faqButton}
              onPress={() => navigation.navigate('FAQs')}
            >
              <Text style={styles.faqButtonText}>View FAQ</Text>
            </TouchableOpacity>
          </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  contactIconContainer: {
    backgroundColor: 'rgba(255, 160, 0, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 3,
  },
  contactDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  socialContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  faqButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  faqButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
};