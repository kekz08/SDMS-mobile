import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../screens/DashboardScreen';
import CustomDrawerContent from '../components/CustomDrawerContent'; // Changed import name
import EducationalAidsScreen from '../screens/EducationalAidsScreen';
import ApplicationStatusScreen from '../screens/ApplicationStatusScreen';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ConcernScreen from '../screens/ConcernScreen';
import ProfileScreen from '../screens/ProfileScreen';

const UserDrawer = createDrawerNavigator();

export default function UserDrawerNavigator() {
  return (
    <UserDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />} // Updated component name
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: '#fff',
        },
      }}
    >
      <UserDrawer.Screen name="Dashboard" component={DashboardScreen} />
      <UserDrawer.Screen name="EducationalAids" component={EducationalAidsScreen} />
      <UserDrawer.Screen name="ApplicationStatus" component={ApplicationStatusScreen} />
      <UserDrawer.Screen name="Announcement" component={AnnouncementScreen} />
      <UserDrawer.Screen name="Concern" component={ConcernScreen} />
      <UserDrawer.Screen name="Profile" component={ProfileScreen} />
    </UserDrawer.Navigator>
  );
}