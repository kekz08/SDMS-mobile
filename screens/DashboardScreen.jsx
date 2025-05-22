import { useState, useEffect } from 'react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  useWindowDimensions, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';
import { API_URL, BASE_URL } from '../config';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    statusCounts: {
      approved: 0,
      pending: 0,
      rejected: 0
    },
    applications: []
  });
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadUserData();
      fetchUserApplications();
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
            console.log('Dashboard - Setting profile image URL:', fullImageUrl);
            
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

  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/user/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          navigation.navigate('Login');
          return;
        }
        throw new Error('Failed to fetch application data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FFA000';
      default:
        return '#757575';
    }
  };

  const ApplicationCard = ({ application }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.scholarshipName}>{application.scholarshipName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
          <Text style={styles.statusText}>{application.status}</Text>
        </View>
      </View>
      <Text style={styles.applicationDate}>
        Applied on: {new Date(application.createdAt).toLocaleDateString()}
      </Text>
      {application.remarks && (
        <Text style={styles.remarks}>Remarks: {application.remarks}</Text>
      )}
      <Text style={styles.amount}>
        Amount: ₱{application.scholarshipAmount?.toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

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
              source={profileImage || require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
              onError={() => setProfileImage(require('../assets/profile-placeholder.png'))}
            />
          </View>
        </View>

        <NotificationPopup 
          visible={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />

        <Text style={styles.heading}>My Scholarship Dashboard</Text>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{dashboardData.statusCounts.approved}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{dashboardData.statusCounts.pending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{dashboardData.statusCounts.rejected}</Text>
            <Text style={styles.summaryLabel}>Rejected</Text>
          </View>
        </View>

        {/* Application Status Chart */}
        {(dashboardData.statusCounts.approved > 0 || 
          dashboardData.statusCounts.pending > 0 || 
          dashboardData.statusCounts.rejected > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Status Overview</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={[
                  { 
                    name: 'Approved',
                    population: dashboardData.statusCounts.approved,
                    color: '#4CAF50',
                    legendFontColor: 'white'
                  },
                  {
                    name: 'Pending',
                    population: dashboardData.statusCounts.pending,
                    color: '#FFA000',
                    legendFontColor: 'white'
                  },
                  {
                    name: 'Rejected',
                    population: dashboardData.statusCounts.rejected,
                    color: '#F44336',
                    legendFontColor: 'white'
                  }
                ]}
                width={width - 40}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Recent Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          {dashboardData.applications.length > 0 ? (
            <View style={styles.applicationsContainer}>
              {dashboardData.applications.map((application, index) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="document-text-outline" size={50} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.noDataText}>No applications yet</Text>
              <TouchableOpacity 
                style={[styles.applyButton, !userData?.isVerified && styles.disabledButton]}
                onPress={() => {
                  if (userData?.isVerified) {
                    navigation.navigate('Educational Aids');
                  } else {
                    Alert.alert(
                      'Verification Required',
                      'Your account must be verified before you can apply for scholarships. Please wait for admin approval.'
                    );
                  }
                }}
                disabled={!userData?.isVerified}
              >
                <Text style={styles.applyButtonText}>
                  {userData?.isVerified ? 'Apply for Scholarship' : 'Verification Required'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#008000' 
  },
  gradient: { 
    ...StyleSheet.absoluteFillObject 
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  applicationsContainer: {
    paddingHorizontal: 20,
  },
  applicationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scholarshipName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  applicationDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remarks: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 10,
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginVertical: 10,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
});