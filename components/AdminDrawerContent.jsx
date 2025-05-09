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

  return (
    <DrawerContentScrollView {...props}>
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
        {/* Admin-specific navigation items */}
        <DrawerItem
          label="Dashboard"
          icon={({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('AdminDashboard')}
        />

        <DrawerItem
          label="User Management"
          icon={({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('UserManagement')}
        />

        <DrawerItem
          label="Scholarship Management"
          icon={({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('ScholarshipManagement')}
        />

        <DrawerItem
          label="Application Review"
          icon={({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('ApplicationReview')}
        />

        <DrawerItem
          label="Announcements"
          icon={({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Announcements')}
        />

        <DrawerItem
          label="Reports"
          icon={({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Reports')}
        />

        <DrawerItem
          label="Settings"
          icon={({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate('Settings')}
        />
      </View>

      <View style={styles.bottomDrawerSection}>
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          )}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
    backgroundColor: '#008000',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  bottomDrawerSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f4',
  },
}); 