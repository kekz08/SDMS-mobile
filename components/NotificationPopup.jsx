import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationPopup = ({ visible, onClose }) => {
  // Static notifications data
  const notifications = [
    {
      id: 1,
      title: 'Application Update',
      message: 'Your scholarship application has been reviewed.',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Document Required',
      message: 'Please submit your latest grade report.',
      time: '1 day ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Interview Schedule',
      message: 'Your interview is scheduled for next week.',
      time: '2 days ago',
      unread: false,
    },
  ];

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.popup}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Notifications</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.notificationList}>
          {notifications.map((notification) => (
            <View 
              key={notification.id} 
              style={[
                styles.notificationItem,
                notification.unread && styles.unreadItem
              ]}
            >
              <View style={styles.notificationIcon}>
                <Ionicons 
                  name="notifications" 
                  size={24} 
                  color={notification.unread ? '#FFD700' : 'white'} 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 1000,
  },
  popup: {
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 85, 0, 0.95)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationList: {
    maxHeight: 350,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  notificationTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default NotificationPopup; 