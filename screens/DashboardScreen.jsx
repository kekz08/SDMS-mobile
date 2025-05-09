import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';

const API_URL = 'http://192.168.254.101:3000/api';
const BASE_URL = 'http://192.168.254.101:3000';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [dashboardData, setDashboardData] = useState({
    totalApplicants: 0,
    approvedApplications: 0,
    pendingApplications: 0
  });
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        setUserData(parsedUserData);
        
        // Handle profile image
        if (parsedUserData.profileImage) {
          try {
            // Construct the full URL if it's a relative path
            const imageUrl = parsedUserData.profileImage.startsWith('http') 
              ? parsedUserData.profileImage 
              : `${BASE_URL}/${parsedUserData.profileImage}`;
            
            console.log('Dashboard - Setting profile image URL:', imageUrl);
            
            // Test if the image URL is valid
            const response = await fetch(imageUrl);
            if (response.ok) {
              setProfileImage({ uri: imageUrl });
            } else {
              console.warn('Profile image not accessible, using default');
              setProfileImage(require('../assets/profile-placeholder.png'));
            }
          } catch (error) {
            console.error('Error loading profile image:', error);
            setProfileImage(require('../assets/profile-placeholder.png'));
          }
        } else {
          console.log('No profile image set, using default');
          setProfileImage(require('../assets/profile-placeholder.png'));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfileImage(require('../assets/profile-placeholder.png'));
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          navigation.navigate('Login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    }
  };

  // College-wise applicants data
  const collegeData = {
    labels: ['CEIT', 'COT', 'CAS', 'CTE'],
    datasets: [{
      data: [120, 85, 65, 110]
    }]
  };

  // Application status data
  const statusData = [
    { 
      name: 'Approved', 
      population: dashboardData.approvedApplications, 
      color: '#4CAF50', 
      legendFontColor: 'white' 
    },
    { 
      name: 'Pending', 
      population: dashboardData.pendingApplications, 
      color: '#FFC107', 
      legendFontColor: 'white' 
    },
    { 
      name: 'Rejected', 
      population: dashboardData.totalApplicants - (dashboardData.approvedApplications + dashboardData.pendingApplications), 
      color: '#F44336', 
      legendFontColor: 'white' 
    }
  ];

  // Monthly trend data
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [45, 78, 92, 110, 135, 150]
    }]
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#005500',
    backgroundGradientTo: '#009000',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: () => '#fff',
    style: { borderRadius: 12 },
    barPercentage: 0.6,
    propsForBackgroundLines: {
      strokeWidth: 0
    },
    propsForLabels: {
      fontSize: 10
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
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
            <Image
              source={profileImage || require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
              onError={() => {
                console.log('Error loading profile image, falling back to default');
                setProfileImage(require('../assets/profile-placeholder.png'));
              }}
            />
          </View>
        </View>

        <NotificationPopup 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />

        <Text style={styles.heading}>Scholarship Dashboard</Text>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>380</Text>
            <Text style={styles.summaryLabel}>Total Applicants</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>215</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>120</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        {/* College-wise Applicants Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicants by College</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={collegeData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={{
                borderRadius: 12,
              }}
              verticalLabelRotation={-15}
            />
          </View>
        </View>

        {/* Application Status Pie Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={statusData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>

        {/* Monthly Trend Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Application Trend</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={monthlyData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={{
                borderRadius: 12,
              }}
              fromZero
            />
          </View>
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
    marginBottom: 10,
  },

  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    width: '30%',
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },

  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 20,
    marginBottom: 10,
  },

  chartContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
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
});