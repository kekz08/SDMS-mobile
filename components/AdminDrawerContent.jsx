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

const BASE_URL = 'http://192.168.254.101:3000';

export default function AdminDrawerContent(props) {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        
        if (parsedUserData.profileImage) {
          const imageUrl = parsedUserData.profileImage.startsWith('http') 
            ? parsedUserData.profileImage 
            : `${BASE_URL}/${parsedUserData.profileImage}`;
          setProfileImage({ uri: imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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