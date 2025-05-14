import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { API_URL } from '../config';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScholarships: 0,
    totalApplications: 0,
    approvalRate: 0,
    monthlyApplications: [],
    scholarshipDistribution: [],
    statusDistribution: [],
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch(`${API_URL}/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setStats({
        totalUsers: data.totalUsers || 0,
        totalScholarships: data.totalScholarships || 0,
        totalApplications: data.totalApplications || 0,
        approvalRate: data.approvalRate || 0,
        monthlyApplications: data.monthlyApplications || [],
        scholarshipDistribution: data.scholarshipDistribution || [],
        statusDistribution: data.statusDistribution || [],
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        `Failed to load reports: ${error.message}`,
        [
          { text: 'Retry', onPress: () => fetchReportData() },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard]}>
      <LinearGradient
        colors={[color, color + '99']}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statContent}>
          <View style={styles.statHeader}>
            <Ionicons name={icon} size={24} color="white" />
            <Text style={styles.statValue}>{value}</Text>
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFA000" />
          <Text style={styles.loaderText}>Loading reports...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FFA000" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <TouchableOpacity onPress={fetchReportData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="people"
            color="#2196F3"
          />
          <StatCard
            title="Total Scholarships"
            value={stats.totalScholarships}
            icon="school"
            color="#4CAF50"
          />
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon="documents"
            color="#FFA000"
          />
          <StatCard
            title="Approval Rate"
            value={`${stats.approvalRate}%`}
            icon="trending-up"
            color="#F44336"
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Monthly Applications</Text>
          {stats.monthlyApplications.length === 0 ? (
            <Text style={styles.noDataText}>No data available for monthly applications.</Text>
          ) : (
            <LineChart
              data={{
                labels: stats.monthlyApplications.map(item => item.month),
                datasets: [{
                  data: stats.monthlyApplications.map(item => item.count)
                }]
              }}
              width={screenWidth - 40 - 16}
              height={260}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 200, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "3",
                  stroke: "#FFA000",
                  fill: '#FFF',
                },
                propsForBackgroundLines: {
                  stroke: '#444',
                  strokeDasharray: '',
                },
                propsForLabels: {
                  fontSize: 13,
                  fontWeight: 'bold',
                },
                propsForHorizontalLabels: {
                  fontSize: 13,
                  fontWeight: 'bold',
                },
                propsForVerticalLabels: {
                  fontSize: 13,
                  fontWeight: 'bold',
                },
                fillShadowGradient: '#FFA000',
                fillShadowGradientOpacity: 0.15,
              }}
              bezier
              style={{ marginVertical: 8, backgroundColor: 'transparent' }}
              withInnerLines={true}
              withOuterLines={true}
              withShadow={true}
            />
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Scholarship Distribution</Text>
          <BarChart
            data={{
              labels: stats.scholarshipDistribution.map(item => item.name),
              datasets: [{
                data: stats.scholarshipDistribution.map(item => item.count)
              }]
            }}
            width={screenWidth - 40 - 16}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {},
              barPercentage: 0.7
            }}
            style={{ marginVertical: 8, backgroundColor: 'transparent' }}
            verticalLabelRotation={30}
            showValuesOnTopOfBars={true}
            fromZero={true}
          />
        </View>

        {stats.statusDistribution.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Application Status Distribution</Text>
            <PieChart
              data={stats.statusDistribution.map(item => ({
                name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                count: item.count,
                color: item.status === 'approved' ? '#4CAF50' :
                       item.status === 'rejected' ? '#F44336' : '#FFA000',
                legendFontColor: '#FFFFFF',
                legendFontSize: 12
              }))}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </View>
        )}
      </ScrollView>
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
  refreshButton: {
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
    paddingHorizontal: 16,
    marginBottom: 32,
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
  chartTitle: {
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
  chart: {
    marginVertical: 8,
    elevation: 3,
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
  noDataText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 30,
    opacity: 0.7,
  },
}); 