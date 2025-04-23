import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // College-wise applicants data
  const collegeData = {
    labels: ['CEIT', 'COT', 'CAS', 'CTE'],
    datasets: [{
      data: [120, 85, 65, 110]
    }]
  };

  // Application status data
  const statusData = [
    { name: 'Approved', population: 215, color: '#4CAF50', legendFontColor: 'white' },
    { name: 'Pending', population: 120, color: '#FFC107', legendFontColor: 'white' },
    { name: 'Rejected', population: 45, color: '#F44336', legendFontColor: 'white' }
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
  
  notificationIcon: {
    marginRight: 10,
  },
});