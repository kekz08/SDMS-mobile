import 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from '../screens/LandingPage';
import ScholarshipScreen from '../screens/ScholarshipScreen';
import FeaturesScreen from '../screens/FeaturesScreen';
import TestimonialsScreen from '../screens/TestimonialsScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreenComponent from '../screens/SplashScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import UserDrawerContent from '../components/UserDrawerContent';
import AdminDrawerContent from '../components/AdminDrawerContent';
import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import EducationalAids from '../screens/EducationalAidsScreen';
import ApplicationStatus from '../screens/ApplicationStatusScreen';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import Concern from '../screens/ConcernScreen';
import Profile from '../screens/ProfileScreen';
import Register from '../screens/RegistrationScreen';
import FeatureDetailScreen from '../screens/FeatureDetailScreen';
import ContactScreen from '../screens/ContactScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ScholarshipManagementScreen from '../screens/ScholarshipManagementScreen';
import ApplicationReviewScreen from '../screens/ApplicationReviewScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

// Guest Drawer
function GuestDrawer({ onLogin }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#fff', width: 250 },
      }}
    >
      <Drawer.Screen name="Home" component={LandingPage} />
      <Drawer.Screen name="Scholarship" component={ScholarshipScreen} />
      <Drawer.Screen name="Features" component={FeaturesScreen} />
      <Drawer.Screen name="Testimonials" component={TestimonialsScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Registration" component={Register} />
      <Drawer.Screen name="FeatureDetail" component={FeatureDetailScreen} />
      <Drawer.Screen name="Contact" component={ContactScreen} />
      <Drawer.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Admin Drawer
function AdminDrawer({ onLogout }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AdminDrawerContent {...props} onLogout={onLogout} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { 
          backgroundColor: '#fff', 
          width: 280 
        },
      }}
      initialRouteName="AdminDashboard"
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ 
          drawerLabel: 'Dashboard',
          title: 'Admin Dashboard'
        }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{
          title: 'User Management'
        }}
      />
      <Drawer.Screen 
        name="ScholarshipManagement" 
        component={ScholarshipManagementScreen}
        options={{
          title: 'Scholarship Management'
        }}
      />
      <Drawer.Screen 
        name="ApplicationReview" 
        component={ApplicationReviewScreen}
        options={{
          title: 'Application Review'
        }}
      />
      <Drawer.Screen 
        name="Announcements" 
        component={AnnouncementScreen}
        options={{
          title: 'Announcements'
        }}
      />
      <Drawer.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          title: 'Reports'
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings'
        }}
      />
    </Drawer.Navigator>
  );
}

// Regular User Drawer
function UserDrawer({ onLogout }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <UserDrawerContent {...props} onLogout={onLogout} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#fff', width: 250 },
      }}
      initialRouteName="Dashboard"
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Educational Aids" component={EducationalAids} />
      <Drawer.Screen name="Application Status" component={ApplicationStatus} />
      <Drawer.Screen name="Announcements" component={AnnouncementScreen} />
      <Drawer.Screen name="Concerns" component={Concern} />
      <Drawer.Screen name="Profile" component={Profile} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setIsLoggedIn(true);
          setUserRole(parsedData.role);
          console.log('User role loaded:', parsedData.role);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
      setTimeout(() => setIsReady(true), 3000);
    };

    initializeApp();
  }, []);

  const handleLogin = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserRole(parsedData.role);
        console.log('Login - User role set to:', parsedData.role);
      }
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (!isReady) {
    return <SplashScreenComponent onFinish={() => setIsReady(true)} />;
  }

  if (!isLoggedIn) {
    return <GuestDrawer onLogin={handleLogin} />;
  }

  // Return appropriate drawer based on user role
  return userRole === 'admin' ? (
    <AdminDrawer onLogout={handleLogout} />
  ) : (
    <UserDrawer onLogout={handleLogout} />
  );
}