import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL, BASE_URL } from '../config';

export default function AdminDrawerContent(props) {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    console.log('AdminDrawerContent: useEffect triggered.');
    loadUserData();
    
    // Add listener for profile image updates
    const profileUpdateListener = props.navigation.addListener('focus', () => {
      console.log('AdminDrawerContent focused, attempting to reload user data...');
      loadUserData();
    });

    return () => {
      profileUpdateListener();
    };
  }, [props.navigation]);

  // Add a useEffect to log when profileImage state changes
  useEffect(() => {
    console.log('AdminDrawerContent: profileImage state updated:', profileImage);
  }, [profileImage]);

  const loadUserData = async () => {
    try {
      console.log('AdminDrawerContent: Loading user data...');
      const userDataString = await AsyncStorage.getItem('userData');
      console.log('AdminDrawerContent: Raw data from AsyncStorage:', userDataString);
      
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        console.log('AdminDrawerContent: Parsed user data:', parsedUserData);
        setUserData(parsedUserData);
        
        if (parsedUserData.profileImage) {
          let imageUrl = parsedUserData.profileImage;
          console.log('AdminDrawerContent: Original image URL from data:', imageUrl);
          
          let finalImageUrl = imageUrl;

          // Check if the URL contains 'uploads/' and extract the relative part
          if (imageUrl.includes('uploads/')) {
            const uploadsIndex = imageUrl.indexOf('uploads/');
            const relativePath = imageUrl.substring(uploadsIndex);
            // Construct the full URL with BASE_URL and add cache buster
            finalImageUrl = `${BASE_URL}/${relativePath}?timestamp=${new Date().getTime()}`;
             console.log('AdminDrawerContent: Extracted relative path from uploads/ and constructed URL:', finalImageUrl);
          } else if (imageUrl.startsWith('http')) {
             // If it's a full http URL, use it directly (add cache buster just in case)
             console.log('AdminDrawerContent: Using http URL directly:', imageUrl);
             finalImageUrl = `${imageUrl}?timestamp=${new Date().getTime()}`;
          } else {
            // Fallback for unexpected format (add cache buster)
            console.warn('AdminDrawerContent: Unexpected image URL format, attempting to prepend BASE_URL:', imageUrl);
            finalImageUrl = `${BASE_URL}/${imageUrl}?timestamp=${new Date().getTime()}`;
          }

          console.log('AdminDrawerContent: Final profile image URL being set:', finalImageUrl);
          setProfileImage({ uri: finalImageUrl });
        } else {
           console.log('AdminDrawerContent: No profile image URL found in user data.');
           setProfileImage(require('../assets/profile-placeholder.png'));
        }
      } else {
        console.log('AdminDrawerContent: No user data found in AsyncStorage.');
        setProfileImage(require('../assets/profile-placeholder.png'));
      }
    } catch (error) {
      console.error('AdminDrawerContent: Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              if (props.onLogout) {
                props.onLogout();
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const CustomDrawerItem = ({ label, icon, onPress, isLogout }) => (
    <DrawerItem
      label={() => (
        <Text style={[
          styles.drawerItemLabel,
          isLogout && styles.logoutLabel
        ]}>
          {label}
        </Text>
      )}
      icon={({ size }) => (
        <Ionicons 
          name={icon} 
          size={size} 
          color={isLogout ? '#F44336' : '#FFFFFF'} 
        />
      )}
      onPress={onPress}
      style={[
        styles.drawerItem,
        isLogout && styles.logoutItem
      ]}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#005500', '#007000', '#009000']}
        style={styles.gradient}
      />
      
      <DrawerContentScrollView {...props} style={styles.scrollView}>
        <View style={styles.drawerHeader}>
          <Image
            source={profileImage || require('../assets/profile-placeholder.png')}
            style={styles.profileImage}
            defaultSource={require('../assets/profile-placeholder.png')}
            onError={(e) => {
              console.error('AdminDrawerContent: Error loading profile image:', e.nativeEvent.error);
              // Optionally set to null or placeholder on error
            }}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData ? `${userData.firstName} ${userData.lastName}` : 'Admin User'}
            </Text>
            <Text style={styles.userRole}>Administrator</Text>
          </View>
        </View>

        <View style={styles.drawerContent}>
          <CustomDrawerItem
            label="Dashboard"
            icon="home-outline"
            onPress={() => props.navigation.navigate('AdminDashboard')}
          />

          <CustomDrawerItem
            label="User Management"
            icon="people-outline"
            onPress={() => props.navigation.navigate('UserManagement')}
          />

          <CustomDrawerItem
            label="Scholarship Management"
            icon="school-outline"
            onPress={() => props.navigation.navigate('ScholarshipManagement')}
          />

          <CustomDrawerItem
            label="Application Review"
            icon="document-text-outline"
            onPress={() => props.navigation.navigate('ApplicationReview')}
          />

          <CustomDrawerItem
            label="Announcements"
            icon="megaphone-outline"
            onPress={() => props.navigation.navigate('Announcements')}
          />

          <CustomDrawerItem
            label="Concerns"
            icon="chatbox-ellipses-outline"
            onPress={() => props.navigation.navigate('AdminConcerns')}
          />

          <CustomDrawerItem
            label="Reports"
            icon="bar-chart-outline"
            onPress={() => props.navigation.navigate('Reports')}
          />

          <CustomDrawerItem
            label="Settings"
            icon="settings-outline"
            onPress={() => props.navigation.navigate('Settings')}
          />
        </View>

        <View style={styles.bottomDrawerSection}>
          <CustomDrawerItem
            label="Logout"
            icon="log-out-outline"
            onPress={handleLogout}
            isLogout={true}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008000',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    backgroundColor: 'transparent',
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  drawerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 10,
  },
  drawerItemLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomDrawerSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 15,
  },
  logoutItem: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  logoutLabel: {
    color: '#F44336',
    fontWeight: 'bold',
  }
}); 