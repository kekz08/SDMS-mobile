import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';
import { API_URL, BASE_URL } from '../config';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPendingUsers, setLoadingPendingUsers] = useState(true);

  // Sample data - replace with actual API calls
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeScholarships: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    loadUserData();
    fetchAdminData();
    fetchPendingUsers();

    // Set up notification refresh interval
    const notificationInterval = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // Refresh every minute

    // Add listener for profile image updates
    const profileUpdateListener = navigation.addListener('focus', () => {
      console.log('AdminDashboardScreen focused, attempting to reload user data...');
      loadUserData();
      fetchAdminData(); // Ensure stats are refreshed on focus
    });

    return () => {
      clearInterval(notificationInterval);
      profileUpdateListener();
    };
  }, [navigation]);

  const loadUserData = async () => {
    try {
      console.log('AdminDashboardScreen: Loading user data...');
      const userDataString = await AsyncStorage.getItem('userData');
      console.log('AdminDashboardScreen: Raw data from AsyncStorage:', userDataString);
      
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        console.log('AdminDashboardScreen: Parsed user data:', parsedUserData);
        
        if (parsedUserData.profileImage) {
          let imageUrl = parsedUserData.profileImage;
          console.log('AdminDashboardScreen: Original image URL from data:', imageUrl);
          
          let finalImageUrl = imageUrl;

          // Check if the URL contains 'uploads/' and extract the relative part
          if (imageUrl.includes('uploads/')) {
            const uploadsIndex = imageUrl.indexOf('uploads/');
            const relativePath = imageUrl.substring(uploadsIndex);
            // Construct the full URL with BASE_URL
            finalImageUrl = `${BASE_URL}/${relativePath}`;
             console.log('AdminDashboardScreen: Extracted relative path from uploads/ and constructed URL:', finalImageUrl);
          } else if (imageUrl.startsWith('http')) {
             // If it's a full http URL but doesn't contain 'uploads/' in the expected way, use it directly.
             // This might be for external images or different storage structures.
             console.log('AdminDashboardScreen: Using http URL directly:', imageUrl);
             finalImageUrl = imageUrl;
          } else {
            // If it doesn't contain 'uploads/' and is not an http URL, it might be just a filename or unexpected format.
            // We can try prepending BASE_URL as a fallback, but log a warning.
            console.warn('AdminDashboardScreen: Unexpected image URL format, attempting to prepend BASE_URL:', imageUrl);
            finalImageUrl = `${BASE_URL}/${imageUrl}`;
          }

          // Add a cache-busting timestamp
          finalImageUrl = `${finalImageUrl}?timestamp=${new Date().getTime()}`;
          
          console.log('AdminDashboardScreen: Final profile image URL being set:', finalImageUrl);
          setProfileImage({ uri: finalImageUrl });
        } else {
           console.log('AdminDashboardScreen: No profile image URL found in user data.');
           setProfileImage(require('../assets/profile-placeholder.png'));
        }
      } else {
        console.log('AdminDashboardScreen: No user data found in AsyncStorage.');
        setProfileImage(require('../assets/profile-placeholder.png'));
      }
    } catch (error) {
      console.error('AdminDashboardScreen: Error loading user data:', error);
      setProfileImage(require('../assets/profile-placeholder.png'));
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification count');
      }

      const data = await response.json();
      setNotificationCount(data.count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching admin stats for dashboard refresh...');
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to fetch admin statistics, response:', errorData);
        throw new Error(errorData?.message || 'Failed to fetch admin statistics');
      }

      const data = await response.json();
      console.log('Admin stats received for dashboard refresh:', data);

      setStats({
        totalUsers: data.totalUsers,
        activeScholarships: data.activeScholarships,
        pendingApplications: data.pendingApplications,
        approvedApplications: data.approvedApplications,
        rejectedApplications: data.rejectedApplications || 0,
        pendingVerifications: data.pendingVerifications || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoadingPendingUsers(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching pending users...');
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const users = await response.json();
      console.log('All users:', users); // Debug log

      // Filter out admin users and already verified users
      const pending = users.filter(user => {
        console.log('Checking user:', {
          id: user.id,
          role: user.role,
          isVerified: user.isVerified,
          firstName: user.firstName,
          lastName: user.lastName
        });
        return user.role !== 'admin' && user.isVerified === false;
      });
      
      console.log('Filtered pending users:', pending); // Debug log
      setPendingUsers(pending);
      
      // Remove the local count update since we're using the server's count
      // setStats(prev => ({
      //   ...prev,
      //   pendingVerifications: pending.length
      // }));
    } catch (error) {
      console.error('Error fetching pending users:', error);
      Alert.alert('Error', 'Failed to load pending users');
    } finally {
      setLoadingPendingUsers(false);
    }
  };

  const verifyUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to verify user');
      }

      // Remove the verified user from the pending list immediately
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      // Update the pending verifications count
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1
      }));

      // Refresh admin stats
      fetchAdminData();
      
      Alert.alert('Success', 'User verified successfully');
    } catch (error) {
      console.error('Error verifying user:', error);
      Alert.alert('Error', error.message || 'Failed to verify user');
    }
  };

  const renderPendingUserCard = ({ item }) => (
    <View style={styles.pendingUserCard}>
      <View style={styles.pendingUserInfo}>
        <Text style={styles.pendingUserName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.pendingUserEmail}>{item.email}</Text>
        {item.studentId && (
          <Text style={styles.pendingUserStudentId}>ID: {item.studentId}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.verifyButton}
        onPress={() => {
          Alert.alert(
            'Verify User',
            `Are you sure you want to verify ${item.firstName} ${item.lastName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Verify', 
                onPress: () => verifyUser(item.id)
              }
            ]
          );
        }}
      >
        <Ionicons name="checkmark-circle-outline" size={24} color="white" />
        <Text style={styles.verifyButtonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.bgLogo} 
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Admin Dashboard</Text>

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
              <NotificationBadge count={notificationCount} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')}>
              <Image
                source={profileImage || require('../assets/profile-placeholder.png')}
                style={styles.profileImage}
                defaultSource={require('../assets/profile-placeholder.png')}
                onError={() => setProfileImage(require('../assets/profile-placeholder.png'))}
              />
            </TouchableOpacity>
          </View>
        </View>

        <NotificationPopup 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          onNotificationRead={fetchNotificationCount}
        />

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFA000" />
            <Text style={styles.loaderText}>Loading dashboard data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#FFA000" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAdminData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('UserManagement')}
              >
                <LinearGradient
                  colors={['#2196F3', '#2196F399']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="people" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.totalUsers}</Text>
                    </View>
                    <Text style={styles.statTitle}>Total Users</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('ScholarshipManagement')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#4CAF5099']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="school" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.activeScholarships}</Text>
                    </View>
                    <Text style={styles.statTitle}>Active Scholarships</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('ApplicationReview', { initialStatus: 'pending' })}
              >
                <LinearGradient
                  colors={['#FFA000', '#FFA00099']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="time" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.pendingApplications}</Text>
                    </View>
                    <Text style={styles.statTitle}>Pending Applications</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('ApplicationReview', { initialStatus: 'approved' })}
              >
                <LinearGradient
                  colors={['#4CAF50', '#4CAF5099']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.approvedApplications}</Text>
                    </View>
                    <Text style={styles.statTitle}>Approved Applications</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('ApplicationReview', { initialStatus: 'rejected' })}
              >
                <LinearGradient
                  colors={['#F44336', '#F4433699']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="close-circle" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.rejectedApplications}</Text>
                    </View>
                    <Text style={styles.statTitle}>Rejected Applications</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('UserManagement', { initialFilter: 'pending' })}
              >
                <LinearGradient
                  colors={['#9C27B0', '#9C27B099']}
                  style={styles.statGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <Ionicons name="person-add" size={24} color="white" />
                      <Text style={styles.statValue}>{stats.pendingVerifications}</Text>
                    </View>
                    <Text style={styles.statTitle}>Pending Verifications</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Pending Users Section */}
            {pendingUsers.length > 0 && (
              <View style={styles.pendingUsersContainer}>
                <Text style={styles.sectionTitle}>Pending User Verifications</Text>
                {loadingPendingUsers ? (
                  <ActivityIndicator size="small" color="#FFA000" />
                ) : (
                  <FlatList
                    data={pendingUsers}
                    renderItem={renderPendingUserCard}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Application Statistics</Text>
              <PieChart
                data={[
                  { 
                    name: 'Approved', 
                    population: stats.approvedApplications, 
                    color: '#4CAF50', 
                    legendFontColor: '#FFFFFF',
                    legendFontSize: 12 
                  },
                  { 
                    name: 'Pending', 
                    population: stats.pendingApplications, 
                    color: '#FFA000', 
                    legendFontColor: '#FFFFFF',
                    legendFontSize: 12 
                  },
                  { 
                    name: 'Rejected', 
                    population: stats.rejectedApplications,
                    color: '#F44336', 
                    legendFontColor: '#FFFFFF',
                    legendFontSize: 12 
                  }
                ]}
                width={width - 40}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
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
  bgLogo: {
    position: 'absolute',
    width: '140%',
    height: '85%',
    opacity: 0.15,
    bottom: '8%',
    right: '-40%',
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statGradient: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  statTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  chartContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  retryButton: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pendingUsersContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pendingUserCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingUserInfo: {
    flex: 1,
  },
  pendingUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pendingUserEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  pendingUserStudentId: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noDataText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
}); 