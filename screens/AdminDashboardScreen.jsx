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

const API_URL = 'http://192.168.254.101:3000/api';
const BASE_URL = 'http://192.168.254.101:3000';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample data - replace with actual API calls
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeScholarships: 0,
    pendingApplications: 0,
    approvedApplications: 0
  });

  useEffect(() => {
    loadUserData();
    fetchAdminData();

    // Set up notification refresh interval
    const notificationInterval = setInterval(() => {
      fetchNotificationCount();
    }, 60000); // Refresh every minute

    return () => clearInterval(notificationInterval);
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        if (parsedUserData.profileImage) {
          const imageUrl = parsedUserData.profileImage.startsWith('http') 
            ? parsedUserData.profileImage 
            : `${BASE_URL}/${parsedUserData.profileImage}`;
          setProfileImage({ uri: imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin statistics');
      }

      const data = await response.json();
      setStats({
        totalUsers: data.totalUsers,
        activeScholarships: data.activeScholarships,
        pendingApplications: data.pendingApplications,
        approvedApplications: data.approvedApplications
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
            <Image
              source={profileImage || require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
              onError={() => setProfileImage(require('../assets/profile-placeholder.png'))}
            />
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
              <View style={[styles.statCard]}>
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
              </View>

              <View style={[styles.statCard]}>
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
              </View>

              <View style={[styles.statCard]}>
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
              </View>

              <View style={[styles.statCard]}>
                <LinearGradient
                  colors={['#F44336', '#F4433699']}
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
              </View>
            </View>

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
                    population: stats.totalUsers - (stats.approvedApplications + stats.pendingApplications), 
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
}); 