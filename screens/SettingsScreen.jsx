import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.254.101:3000/api';

export default function SettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
    applicationDeadlineReminder: 7,
    maxApplicationsPerUser: 3,
    autoApproveUsers: false,
    requireEmailVerification: true,
    systemEmail: 'system@example.com',
    supportEmail: 'support@example.com',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/admin/settings/${key}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      Alert.alert('Error', error.message);
      // Revert the change in UI
      setSettings(prev => ({ ...prev }));
    }
  };

  const SettingSwitch = ({ title, description, value, settingKey }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Switch
          value={value}
          onValueChange={(newValue) => updateSetting(settingKey, newValue)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={value ? '#008000' : '#f4f3f4'}
        />
      </View>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
  );

  const SettingInput = ({ title, description, value, settingKey, keyboardType = 'default' }) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingTitle}>{title}</Text>
      <TextInput
        style={styles.input}
        value={String(value)}
        onChangeText={(text) => {
          const newValue = keyboardType === 'numeric' ? parseInt(text) || 0 : text;
          updateSetting(settingKey, newValue);
        }}
        keyboardType={keyboardType}
      />
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <ActivityIndicator size="large" color="white" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={fetchSettings}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingSwitch
            title="Email Notifications"
            description="Send email notifications for important updates"
            value={settings.emailNotifications}
            settingKey="emailNotifications"
          />
          <SettingSwitch
            title="Push Notifications"
            description="Enable push notifications for mobile devices"
            value={settings.pushNotifications}
            settingKey="pushNotifications"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <SettingSwitch
            title="Maintenance Mode"
            description="Put the system in maintenance mode"
            value={settings.maintenanceMode}
            settingKey="maintenanceMode"
          />
          <SettingInput
            title="Application Deadline Reminder (days)"
            description="Days before deadline to send reminder"
            value={settings.applicationDeadlineReminder}
            settingKey="applicationDeadlineReminder"
            keyboardType="numeric"
          />
          <SettingInput
            title="Max Applications Per User"
            description="Maximum number of active applications allowed per user"
            value={settings.maxApplicationsPerUser}
            settingKey="maxApplicationsPerUser"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Management</Text>
          <SettingSwitch
            title="Auto-approve Users"
            description="Automatically approve new user registrations"
            value={settings.autoApproveUsers}
            settingKey="autoApproveUsers"
          />
          <SettingSwitch
            title="Email Verification"
            description="Require email verification for new accounts"
            value={settings.requireEmailVerification}
            settingKey="requireEmailVerification"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <SettingInput
            title="System Email"
            description="Email address for system notifications"
            value={settings.systemEmail}
            settingKey="systemEmail"
          />
          <SettingInput
            title="Support Email"
            description="Email address for user support"
            value={settings.supportEmail}
            settingKey="supportEmail"
          />
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 