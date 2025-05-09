import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import DashboardScreen from '../screens/DashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EducationalAidsScreen from '../screens/EducationalAidsScreen';
import ApplicationStatusScreen from '../screens/ApplicationStatusScreen';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import ConcernScreen from '../screens/ConcernScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const [userRole, setUserRole] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log('DrawerNavigator focused - loading user role');
      loadUserRole();
    }
  }, [isFocused]);

  const loadUserRole = async () => {
    try {
      console.log('Attempting to load user data from storage');
      const userData = await AsyncStorage.getItem('userData');
      console.log('Raw user data from storage:', userData);
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log('Parsed user data:', {
          id: parsedData.id,
          email: parsedData.email,
          role: parsedData.role,
          timestamp: new Date().toISOString()
        });
        setUserRole(parsedData.role);
      } else {
        console.log('No user data found in storage');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole(null);
    }
  };

  console.log('Current user role:', userRole);

  // Determine initial route based on role
  const getInitialRouteName = () => {
    const route = userRole === 'admin' ? 'AdminDashboard' : 'Dashboard';
    console.log('Initial route determined:', route, 'for role:', userRole);
    return route;
  };

  return (
    <Drawer.Navigator
      initialRouteName={getInitialRouteName()}
      drawerContent={props => <CustomDrawerContent {...props} userRole={userRole} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#00AA00',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          marginLeft: -25,
          fontSize: 15,
        },
      }}
    >
      {userRole === 'admin' ? (
        <Drawer.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            drawerIcon: ({color}) => (
              <Ionicons name="home-outline" size={22} color={color} />
            ),
            drawerLabel: 'Admin Dashboard'
          }}
        />
      ) : (
        <Drawer.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            drawerIcon: ({color}) => (
              <Ionicons name="home-outline" size={22} color={color} />
            ),
          }}
        />
      )}

      {/* Only show these screens for non-admin users */}
      {userRole !== 'admin' && (
        <>
          <Drawer.Screen
            name="Educational Aids"
            component={EducationalAidsScreen}
            options={{
              drawerIcon: ({color}) => (
                <Ionicons name="school-outline" size={22} color={color} />
              ),
            }}
          />

          <Drawer.Screen
            name="Application Status"
            component={ApplicationStatusScreen}
            options={{
              drawerIcon: ({color}) => (
                <Ionicons name="document-text-outline" size={22} color={color} />
              ),
            }}
          />

          <Drawer.Screen
            name="Concern"
            component={ConcernScreen}
            options={{
              drawerIcon: ({color}) => (
                <Ionicons name="chatbox-ellipses-outline" size={22} color={color} />
              ),
            }}
          />
        </>
      )}

      {/* Common screens for all users */}
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({color}) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Announcement"
        component={AnnouncementScreen}
        options={{
          drawerIcon: ({color}) => (
            <Ionicons name="megaphone-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 