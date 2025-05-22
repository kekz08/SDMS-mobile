import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';
import { API_URL } from '../config';

export default function AnnouncementScreen({ navigation }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal', // 'high', 'normal', 'low'
    status: 'active'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!token || !userData) {
        console.log('Missing auth data:', { token: !!token, userData: !!userData });
        return;
      }

      const user = JSON.parse(userData);
      console.log('Fetching announcements for user:', user.role);

      const response = await fetch(`${API_URL}/admin/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Fetched announcements:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch announcements');
      }

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error in fetchAnnouncements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      status: 'active'
    });
  };

  const handleCreatePress = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleAddAnnouncement = () => {
    console.log('Add announcement button pressed');
    setEditMode(false);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      status: 'active'
    });
    setModalVisible(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditMode(true);
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status
    });
    setModalVisible(true);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      Alert.alert('Error', 'Content is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log('Submit button pressed', formData);

    try {
      // Form validation
      if (!formData.title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }
      if (!formData.content.trim()) {
        Alert.alert('Error', 'Please enter content');
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (!token || !userData) {
        Alert.alert('Error', 'Please log in to create announcements');
        return;
      }

      const user = JSON.parse(userData);
      console.log('Current user:', user);

      const requestData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        status: formData.status,
        createdBy: user.id
      };

      console.log('Sending announcement data:', requestData);
      console.log('API URL:', `${API_URL}/admin/announcements`);

      const response = await fetch(`${API_URL}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response received:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create announcement');
      }

      // Reset form and update UI
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        status: 'active'
      });
      setModalVisible(false);
      
      // Fetch updated announcements
      await fetchAnnouncements();
      
      Alert.alert(
        'Success',
        'Announcement created successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create announcement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      setAnnouncements(announcements.filter(a => a.id !== announcementId));
      Alert.alert('Success', 'Announcement deleted successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderAnnouncementCard = ({ item }) => (
    <View style={styles.announcementCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <View style={[
          styles.priorityBadge,
          { backgroundColor: item.priority === 'high' ? '#fae3e3' : item.priority === 'normal' ? '#e3f6e8' : '#fff7e3', borderColor: item.priority === 'high' ? '#e53935' : item.priority === 'normal' ? '#43a047' : '#ffa000' }
        ]}>
          <Ionicons name={item.priority === 'high' ? 'alert-circle' : item.priority === 'normal' ? 'checkmark-circle' : 'time'} size={16} color={item.priority === 'high' ? '#e53935' : item.priority === 'normal' ? '#43a047' : '#ffa000'} />
          <Text style={[styles.priorityText, { color: item.priority === 'high' ? '#e53935' : item.priority === 'normal' ? '#388e3c' : '#ffa000' }]}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.announcementContent}>{item.content}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditAnnouncement(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={22} color="#1976d2" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              'Delete Announcement',
              'Are you sure you want to delete this announcement?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => handleDeleteAnnouncement(item.id)
                }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={22} color="#e53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPriorityButtons = () => (
    <View style={styles.priorityButtons}>
      {['high', 'normal', 'low'].map((priority) => (
        <TouchableOpacity
          key={priority}
          style={[
            styles.priorityButton,
            formData.priority === priority && styles.selectedPriorityButton
          ]}
          onPress={() => setFormData({ ...formData, priority })}
        >
          <Text style={[
            styles.priorityButtonText,
            formData.priority === priority && styles.selectedPriorityButtonText
          ]}>
            {priority.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Add this useEffect to log when announcements change
  useEffect(() => {
    console.log('Announcements state updated:', announcements);
  }, [announcements]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setShowNotifications(!showNotifications)}
            style={styles.notificationButton}
          >
            <Ionicons 
              name={showNotifications ? "notifications" : "notifications-outline"} 
              size={26} 
              color="white" 
            />
            <NotificationBadge />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleAddAnnouncement}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <NotificationPopup 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Loading announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No announcements available</Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            renderItem={renderAnnouncementCard}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchAnnouncements}
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal closing');
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Announcement' : 'New Announcement'}
            </Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="Announcement title"
              />

              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({...formData, content: text})}
                placeholder="Announcement content"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Priority</Text>
              {renderPriorityButtons()}

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'active' && styles.activeStatusButton
                  ]}
                  onPress={() => setFormData({...formData, status: 'active'})}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === 'active' && styles.activeStatusButtonText
                  ]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'inactive' && styles.activeStatusButton
                  ]}
                  onPress={() => setFormData({...formData, status: 'inactive'})}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === 'inactive' && styles.activeStatusButtonText
                  ]}>Inactive</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  loading && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editMode ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f2f2f2',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.5,
    marginLeft: 8,
  },
  priorityText: { fontWeight: 'bold', fontSize: 13, marginLeft: 5 },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f2f2f2',
    marginVertical: 14,
    borderRadius: 1,
  },
  announcementContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#e3ecfa',
    borderColor: '#1976d2',
  },
  deleteButton: {
    backgroundColor: '#fae3e3',
    borderColor: '#e53935',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: '80%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedPriorityButton: {
    backgroundColor: '#4CAF50',
  },
  priorityButtonText: {
    fontWeight: 'bold',
    color: '#666',
  },
  selectedPriorityButtonText: {
    color: 'white',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeStatusButton: {
    backgroundColor: '#4CAF50',
  },
  statusButtonText: {
    fontWeight: 'bold',
    color: '#666',
  },
  activeStatusButtonText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  addButton: {
    padding: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
});