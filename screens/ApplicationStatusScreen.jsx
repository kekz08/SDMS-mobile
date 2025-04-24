import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ApplicationStatusScreen() {
  const navigation = useNavigation();

  // Sample application status data
  const statusData = [
    {
      type: 'Approved',
      count: 2,
      description: 'Your approved scholarship applications',
      color: '#4CAF50',
      icon: 'checkmark-circle'
    },
    {
      type: 'Pending',
      count: 1,
      description: 'Applications under review',
      color: '#FFC107',
      icon: 'time'
    },
    {
      type: 'Rejected',
      count: 0,
      description: 'Unsuccessful applications',
      color: '#F44336',
      icon: 'close-circle'
    }
  ];

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
              source={require('../assets/haidee.jpg')}
              style={styles.profileImage}
            />
          </View>
        </View>

        <Text style={styles.heading}>Application Status</Text>
        <Text style={styles.description}>
          Your scholarship application status overview
        </Text>

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
          
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>CEIT Scholarship</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: '#4CAF50' }]}>Approved</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Applied:</Text>
              <Text style={styles.detailValue}>April 15, 2025</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Decision Date:</Text>
              <Text style={styles.detailValue}>April 2, 2025</Text>
            </View>
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
  
  notificationIcon: {
    marginRight: 10,
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
});