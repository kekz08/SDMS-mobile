import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';

const BASE_URL = 'http://192.168.254.101:3000';

export default function AnnouncementScreen() {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png')); // Default image
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        if (parsedUserData.profileImage) {
          // Check if the profileImage is a relative path
          const imageUrl = parsedUserData.profileImage.startsWith('http') 
            ? parsedUserData.profileImage 
            : `${BASE_URL}/${parsedUserData.profileImage}`;
          console.log('Announcements - Setting profile image URL:', imageUrl);
          setProfileImage({ uri: imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Sample announcement data
  const announcements = [
    {
      id: 1,
      title: 'Scholarship Application Deadline',
      date: 'May 15, 2023',
      content: 'The deadline for scholarship applications has been extended to May 30, 2023. Please submit all required documents before this date.'
    },
    {
      id: 2,
      title: 'New Scholarship Program',
      date: 'April 28, 2023',
      content: 'We are pleased to announce a new scholarship program for CEIT students. Applications will open next week.'
    },
    {
      id: 3,
      title: 'Interview Schedule',
      date: 'April 20, 2023',
      content: 'Shortlisted applicants will be notified via email for their interview schedule. Please check your inbox regularly.'
    }
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />

        <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <TouchableOpacity 
              onPress={() => setShowNotifications(!showNotifications)}
              style={styles.notificationButton}
            >
              <Ionicons 
                name={showNotifications ? "notifications" : "notifications-outline"} 
                size={26} 
                color="white" 
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
            <Image
              source={profileImage}
              style={styles.profileImage}
            />
          </View>
        </View>

        <NotificationPopup 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />

        <Text style={styles.heading}>Announcements</Text>
        <Text style={styles.description}>
          Important updates and notices
        </Text>

        <View style={styles.contentContainer}>
          {announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementDate}>{announcement.date}</Text>
              <Text style={styles.announcementContent}>{announcement.content}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
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

  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },

  description: {
    fontSize: 15,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  contentContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  announcementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },

  announcementDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    fontStyle: 'italic',
  },

  announcementContent: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 20,
  },
});