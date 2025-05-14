import { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../config';
import { useIsFocused } from '@react-navigation/native';

export default function UserDrawerContent({ navigation, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png'));
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadUserData();
    }
  }, [isFocused]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        
        if (parsedUserData.profileImage) {
          try {
            let imageUrl = parsedUserData.profileImage;
            if (imageUrl.includes('uploads/')) {
              imageUrl = imageUrl.substring(imageUrl.indexOf('uploads/'));
            }
            const fullImageUrl = `${BASE_URL}/${imageUrl}`;
            const imageResponse = await fetch(fullImageUrl);
            if (imageResponse.ok) {
              setProfileImage({ uri: fullImageUrl });
            } else {
              throw new Error(`Image not accessible: ${imageResponse.status}`);
            }
          } catch (error) {
            console.error('Error loading profile image:', error);
            setProfileImage(require('../assets/profile-placeholder.png'));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfileImage(require('../assets/profile-placeholder.png'));
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
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout properly. Please try again.');
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
      
      <DrawerContentScrollView style={styles.scrollView}>
        <View style={styles.drawerHeader}>
          <Image
            source={profileImage}
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
            </Text>
            <Text style={styles.userRole}>Student</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={styles.verifiedIcon} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.drawerContent}>
          <CustomDrawerItem
            label="Dashboard"
            icon="home-outline"
            onPress={() => navigation.navigate('Dashboard')}
          />

          <CustomDrawerItem
            label="Educational Aids"
            icon="book-outline"
            onPress={() => navigation.navigate('Educational Aids')}
          />

          <CustomDrawerItem
            label="Application Status"
            icon="star-outline"
            onPress={() => navigation.navigate('Application Status')}
          />

          <CustomDrawerItem
            label="Announcements"
            icon="megaphone-outline"
            onPress={() => navigation.navigate('Announcements')}
          />

          <CustomDrawerItem
            label="Concerns"
            icon="information-circle-outline"
            onPress={() => navigation.navigate('Concerns')}
          />

          <CustomDrawerItem
            label="Profile"
            icon="person-outline"
            onPress={() => navigation.navigate('Profile')}
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
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  verifiedIcon: {
    marginRight: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#FFFFFF',
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
