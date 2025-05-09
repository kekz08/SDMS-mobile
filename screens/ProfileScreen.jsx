import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';

// Use your local IP address for all platforms
const API_URL = 'http://192.168.254.101:3000/api';
const BASE_URL = 'http://192.168.254.101:3000';

// Add a function to test server connectivity
const testServerConnectivity = async (token) => {
  try {
    console.log('Testing server connectivity...');
    const testResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      // Add timeout
      timeout: 5000
    });
    
    if (!testResponse.ok) {
      throw new Error(`Server responded with status ${testResponse.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Server connectivity test failed:', error);
    return false;
  }
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png'));
  const [isUploading, setIsUploading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('=== Loading User Data in ProfileScreen ===');
      const userDataString = await AsyncStorage.getItem('userData');
      console.log('Raw data from AsyncStorage:', userDataString);
      
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        console.log('Parsed user data:', {
          ...parsedUserData,
          contactNumber: parsedUserData.contactNumber === null ? 'NULL' : `'${parsedUserData.contactNumber}'`,
          address: parsedUserData.address === null ? 'NULL' : `'${parsedUserData.address}'`
        });

        // Set the user data directly from parsed data
        setUserData(parsedUserData);
        console.log('User data set in state:', {
          ...parsedUserData,
          contactNumber: parsedUserData.contactNumber === null ? 'NULL' : `'${parsedUserData.contactNumber}'`,
          address: parsedUserData.address === null ? 'NULL' : `'${parsedUserData.address}'`
        });
        
        if (parsedUserData.profileImage) {
          const imageUrl = parsedUserData.profileImage.startsWith('http') 
            ? parsedUserData.profileImage 
            : `${BASE_URL}/${parsedUserData.profileImage}`;
          console.log('Setting profile image URL:', imageUrl);
          setProfileImage({ uri: imageUrl });
        } else {
          console.log('No profile image URL found, using default');
          setProfileImage(require('../assets/profile-placeholder.png'));
        }
      } else {
        console.log('No user data found in AsyncStorage');
        setUserData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      console.error('Error details:', error.message);
      setUserData(null);
    }
  };

  // Add a useEffect to log when userData changes
  useEffect(() => {
    console.log('=== userData State Updated ===');
    console.log('Current userData state:', userData ? {
      ...userData,
      contactNumber: userData.contactNumber === null ? 'NULL' : `'${userData.contactNumber}'`,
      address: userData.address === null ? 'NULL' : `'${userData.address}'`
    } : 'null');
  }, [userData]);

  const pickImage = async () => {
    try {
      console.log('Starting image picker...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos.');
        return;
      }

      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2
      });

      console.log('Image picker result:', result.canceled ? 'canceled' : 'success');
      
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        
        // Create FormData
        const formData = new FormData();
        formData.append('profileImage', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });

        await uploadProfilePicture(formData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        `Failed to pick image: ${error.message}. Please try again.`
      );
    }
  };

  const uploadProfilePicture = async (formData) => {
    try {
      setIsUploading(true);

      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Starting profile picture upload...');
      console.log('Token available:', !!token);
      console.log('Using API URL:', API_URL);

      // Test server connectivity
      const isServerAccessible = await testServerConnectivity(token);
      if (!isServerAccessible) {
        throw new Error('Cannot connect to server. Make sure the server is running and accessible.');
      }

      // Proceed with upload if server is responsive
      const response = await fetch(`${API_URL}/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to upload profile picture');
      }

      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUserData(data.user);
        if (data.user.profileImage) {
          setProfileImage({ uri: data.user.profileImage });
        }
      }
      
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        `Failed to upload profile picture: ${error.message}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    console.log('Updating field:', field, 'with value:', value);
    setUserData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated user data:', updated);
      return updated;
    });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token available:', !!token);
      console.log('Updating profile with data:', JSON.stringify(userData, null, 2));

      const response = await fetch(`${API_URL}/users/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          contactNumber: userData.contactNumber || '',
          address: userData.address || ''
        }),
      });

      console.log('Update response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const updatedData = JSON.parse(responseText);
      console.log('Successfully updated profile. New data:', updatedData);
      
      // Ensure we preserve contact number and address
      const newUserData = {
        ...updatedData,
        contactNumber: updatedData.contactNumber || '',
        address: updatedData.address || ''
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      setUserData(newUserData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', `Failed to update profile: ${error.message}. Please try again.`);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        Alert.alert('Error', 'Please fill in all password fields');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Error', 'New password and confirm password do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters long');
        return;
      }

      // Get token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      // Check network connectivity first
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network and try again.');
        return;
      }

      // Test server connectivity
      const isServerAccessible = await testServerConnectivity(token);
      if (!isServerAccessible) {
        Alert.alert('Error', 'Cannot connect to server. Please check if the server is running.');
        return;
      }

      console.log('Making password change request to:', `${API_URL}/users/change-password`);
      
      // Make API call to change password
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      // Log response details for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Raw response was:', responseText);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        `Failed to change password: ${error.message}. Please try again.`
      );
    }
  };

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
            <TouchableOpacity onPress={() => {/* navigate to notifications */}}>
              <Ionicons name="notifications" size={26} color="white" style={styles.notificationIcon} />
            </TouchableOpacity>
            <Image
              source={profileImage}
              style={styles.headerProfileImage}
              onError={(e) => {
                console.error('Error loading profile image:', e.nativeEvent.error);
                setProfileImage(require('../assets/profile-placeholder.png'));
              }}
            />
          </View>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} disabled={!isEditing || isUploading}>
            <View style={styles.profileImageContainer}>
              <Image
                source={profileImage}
                style={styles.profileImage}
                onError={(e) => {
                  console.error('Error loading profile image:', e.nativeEvent.error);
                  setProfileImage(require('../assets/profile-placeholder.png'));
                }}
              />
              {isEditing && (
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={24} color="white" />
                  <Text style={styles.editOverlayText}>Change Photo</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{userData?.firstName} {userData?.lastName}</Text>
          <Text style={styles.profileRole}>Scholarship Grantee</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'password' && styles.activeTab]}
            onPress={() => setActiveTab('password')}
          >
            <Text style={styles.tabText}>Password</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'profile' ? (
          <View style={styles.profileContent}>
            {isEditing ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={userData?.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={userData?.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    value={userData?.contactNumber}
                    onChangeText={(text) => handleInputChange('contactNumber', text)}
                    keyboardType="phone-pad"
                    placeholder="Enter contact number"
                    placeholderTextColor="#aaa"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={userData?.address}
                    onChangeText={(text) => handleInputChange('address', text)}
                    multiline
                    placeholder="Enter address"
                    placeholderTextColor="#aaa"
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Student ID</Text>
                  <Text style={styles.infoValue}>{userData?.studentId}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>College</Text>
                  <Text style={styles.infoValue}>{userData?.college}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Course</Text>
                  <Text style={styles.infoValue}>{userData?.course}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData?.email}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Contact Number</Text>
                  <Text style={styles.infoValue}>
                    {userData && userData.contactNumber !== null && userData.contactNumber !== undefined && userData.contactNumber !== '' 
                      ? userData.contactNumber 
                      : 'Not set'}
                  </Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {userData && userData.address !== null && userData.address !== undefined && userData.address !== '' 
                      ? userData.address 
                      : 'Not set'}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.passwordContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => handlePasswordChange('newPassword', text)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.saveButton, { marginTop: 20 }]}
              onPress={handleChangePassword}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        )}
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

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  
  notificationIcon: {
    marginRight: 10,
  },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'white',
  },

  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },

  editOverlayText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },

  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },

  profileRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },

  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  tabText: {
    color: 'white',
    fontWeight: 'bold',
  },

  profileContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  passwordContent: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  infoGroup: {
    marginBottom: 15,
  },

  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },

  inputGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },

  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  button: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  saveButton: {
    backgroundColor: '#FFA000',
  },

  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});