import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';
import { API_URL, BASE_URL } from '../config';

export default function ApplicationStatusScreen() {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    loadUserData();
    fetchApplications();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        if (parsedUserData.profileImage) {
          try {
            // Clean up the URL path by removing any absolute path references
            let imageUrl = parsedUserData.profileImage;
            if (imageUrl.includes('uploads/')) {
              // Extract just the uploads part of the path
              imageUrl = imageUrl.substring(imageUrl.indexOf('uploads/'));
            }
            
            // Construct the full URL
            const fullImageUrl = `${BASE_URL}/${imageUrl}`;
            console.log('Application Status - Setting profile image URL:', fullImageUrl);
            
            // Test if image is accessible
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
        } else {
          console.log('No profile image URL found, using default');
          setProfileImage(require('../assets/profile-placeholder.png'));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfileImage(require('../assets/profile-placeholder.png'));
    }
  };

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Fetching applications with token:', token ? 'Token exists' : 'No token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making request to:', `${API_URL}/user/applications`);
      const response = await fetch(`${API_URL}/user/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(errorData?.message || 'Failed to fetch applications');
      }

      const data = await response.json();
      console.log('Applications data received:', {
        statusCounts: data.statusCounts,
        applicationCount: data.applications.length
      });

      setStatusCounts(data.statusCounts);
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert(
        'Error',
        'Failed to load applications. Please try again later.',
        [{ text: 'Retry', onPress: () => fetchApplications() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    {
      type: 'Approved',
      count: statusCounts.approved,
      description: 'Your approved scholarship applications',
      color: '#4CAF50',
      icon: 'checkmark-circle'
    },
    {
      type: 'Pending',
      count: statusCounts.pending,
      description: 'Applications under review',
      color: '#FFC107',
      icon: 'time'
    },
    {
      type: 'Rejected',
      count: statusCounts.rejected,
      description: 'Unsuccessful applications',
      color: '#F44336',
      icon: 'close-circle'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#FFC107';
    }
  };

  const handleReapply = async (application) => {
    try {
      // Store the application data in AsyncStorage for pre-filling the form
      await AsyncStorage.setItem('reapplyData', JSON.stringify({
        scholarshipId: application.scholarshipId,
        previousApplication: {
          ...application,
          isReapplication: true,
          previousApplicationId: application.id
        }
      }));

      // Navigate to Educational Aids screen
      navigation.navigate('Educational Aids', {
        screen: 'apply',
        scholarshipId: application.scholarshipId,
        isReapplication: true
      });
    } catch (error) {
      console.error('Error preparing reapplication:', error);
      Alert.alert('Error', 'Failed to prepare reapplication. Please try again.');
    }
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
              <NotificationBadge />
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

        <Text style={styles.heading}>Application Status</Text>
        <Text style={styles.description}>
          Your scholarship application status overview
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="white" style={styles.loader} />
        ) : (
          <>
            <View style={styles.statusContainer}>
              {statusData.map((status, index) => (
                <View 
                  key={index} 
                  style={[styles.statusCard, { backgroundColor: status.color }]}
                >
                  <View style={styles.statusHeader}>
                    <Ionicons name={status.icon} size={28} color="white" />
                    <Text style={styles.statusType}>{status.type}</Text>
                  </View>
                  <Text style={styles.statusCount}>{status.count}</Text>
                  <Text style={styles.statusDescription}>{status.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Application Details</Text>
              
              {applications.length > 0 ? (
                applications.map((application, index) => (
                  <View key={index} style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>{application.scholarshipName}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={[styles.detailValue, { color: getStatusColor(application.status) }]}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date Applied:</Text>
                      <Text style={styles.detailValue}>{formatDate(application.createdAt)}</Text>
                    </View>
                    {application.updatedAt !== application.createdAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Last Updated:</Text>
                        <Text style={styles.detailValue}>{formatDate(application.updatedAt)}</Text>
                      </View>
                    )}
                    {application.remarks && (
                      <View style={styles.remarksContainer}>
                        <Text style={styles.remarksLabel}>Remarks:</Text>
                        <Text style={styles.remarksText}>{application.remarks}</Text>
                      </View>
                    )}
                    {application.status === 'rejected' && (
                      <View style={styles.reapplyContainer}>
                        <Text style={styles.reapplyNote}>
                          Review the remarks above and consider updating your application based on the feedback.
                        </Text>
                        <TouchableOpacity
                          style={styles.reapplyButton}
                          onPress={() => handleReapply(application)}
                        >
                          <Ionicons name="refresh" size={20} color="white" />
                          <Text style={styles.reapplyButtonText}>Update & Reapply</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noApplications}>
                  <Ionicons name="document-outline" size={50} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.noApplicationsText}>No applications submitted yet</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#008000' },
  gradient: { ...StyleSheet.absoluteFillObject },
  loader: { marginTop: 30 },

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

  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    maxWidth: '30%',
    alignItems: 'center',
  },

  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  statusType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 5,
  },

  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },

  statusDescription: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },

  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },

  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },

  remarksContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },

  remarksLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },

  remarksText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  noApplications: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },

  noApplicationsText: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },

  reapplyContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  reapplyNote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reapplyButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    gap: 8,
  },
  reapplyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});