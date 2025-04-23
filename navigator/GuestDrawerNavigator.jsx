// navigation/GuestDrawerNavigator.jsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import LandingPage from '../screens/LandingPage';
import ScholarshipScreen from '../screens/ScholarshipScreen';
import FeaturesScreen from '../screens/FeaturesScreen';
import TestimonialsScreen from '../screens/TestimonialsScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function GuestDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Home" component={LandingPage} />
      <Drawer.Screen name="Scholarship" component={ScholarshipScreen} />
      <Drawer.Screen name="Features" component={FeaturesScreen} />
      <Drawer.Screen name="Testimonials" component={TestimonialsScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Login" component={LoginScreen} />
    </Drawer.Navigator>
  );
}
