import 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LandingPage from '../screens/LandingPage';
import ScholarshipScreen from '../screens/ScholarshipScreen';
import FeaturesScreen from '../screens/FeaturesScreen';
import TestimonialsScreen from '../screens/TestimonialsScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreenComponent from '../screens/SplashScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import UserDrawerContent from '../components/UserDrawerContent';
import DashboardScreen from '../screens/DashboardScreen';
import EducationalAids from '../screens/EducationalAidsScreen';
import ApplicationStatus from '../screens/ApplicationStatusScreen';
import Announcement from '../screens/AnnouncementScreen';
import Concern from '../screens/ConcernScreen';
import Profile from '../screens/ProfileScreen';
import Register from '../screens/RegistrationScreen';
import FeatureDetailScreen from '../screens/FeatureDetailScreen';
import ContactScreen from '../screens/ContactScreen';

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

// Logged-In Drawer
function UserDrawer({ onLogout }) {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <UserDrawerContent {...props} onLogout={onLogout} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#fff', width: 250 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Educational Aids" component={EducationalAids} />
      <Drawer.Screen name="Application Status" component={ApplicationStatus} />
      <Drawer.Screen name="Announcements" component={Announcement} />
      <Drawer.Screen name="Concerns" component={Concern} />
      <Drawer.Screen name="Profile" component={Profile} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 3000);
  }, []);

  if (!isReady) {
    return <SplashScreenComponent onFinish={() => setIsReady(true)} />;
  }

  return isLoggedIn ? (
    <UserDrawer onLogout={() => setIsLoggedIn(false)} />
  ) : (
    <GuestDrawer onLogin={() => setIsLoggedIn(true)} />
  );
}