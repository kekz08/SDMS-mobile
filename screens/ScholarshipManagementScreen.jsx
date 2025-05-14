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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { API_URL } from '../config';

export default function ScholarshipManagementScreen({ navigation }) {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: new Date(),
    slots: '',
    requirements: '',
    status: 'active',
    amount: '',
    criteria: '',
    documents: ''
  });

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      console.log('Fetching scholarships with token:', token ? token.substring(0, 10) + '...' : 'no token');
      
      const response = await fetch(`${API_URL}/admin/scholarships`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to fetch scholarships: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Fetched scholarships:', data);
      setScholarships(data);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScholarship = () => {
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      deadline: new Date(),
      slots: '',
      requirements: '',
      status: 'active',
      amount: '',
      criteria: '',
      documents: ''
    });
    setModalVisible(true);
  };

  const handleEditScholarship = (scholarship) => {
    setEditMode(true);
    setSelectedScholarship(scholarship);
    setFormData({
      name: scholarship.name,
      description: scholarship.description,
      deadline: new Date(scholarship.deadline),
      slots: scholarship.slots.toString(),
      requirements: scholarship.requirements,
      status: scholarship.status || 'active',
      amount: scholarship.amount ? scholarship.amount.toString() : '',
      criteria: scholarship.criteria || '',
      documents: scholarship.documents || ''
    });
    setModalVisible(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Scholarship name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!formData.requirements.trim()) {
      Alert.alert('Error', 'Requirements are required');
      return false;
    }
    if (!formData.slots || isNaN(formData.slots)) {
      Alert.alert('Error', 'Valid number of slots is required');
      return false;
    }
    if (!formData.amount || isNaN(formData.amount)) {
      Alert.alert('Error', 'Valid scholarship amount is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      console.log('Token found:', token.substring(0, 10) + '...');

      const url = editMode 
        ? `${API_URL}/admin/scholarships/${selectedScholarship.id}`
        : `${API_URL}/admin/scholarships`;
      
      console.log('Request URL:', url);
      console.log('Request method:', editMode ? 'PUT' : 'POST');
      
      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline.toISOString().split('T')[0],
        slots: parseInt(formData.slots),
        requirements: formData.requirements.trim(),
        amount: parseFloat(formData.amount),
        criteria: formData.criteria?.trim() || null,
        documents: formData.documents?.trim() || null,
        status: formData.status || 'active'
      };

      console.log('Submitting scholarship data:', requestBody);
      
      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        console.error('Server response:', errorData);
        if (errorData.error) {
          throw new Error(`Failed to ${editMode ? 'update' : 'create'} scholarship: ${errorData.error}`);
        }
        throw new Error(errorData.message || `Failed to ${editMode ? 'update' : 'create'} scholarship`);
      }

      await fetchScholarships();
      setModalVisible(false);
      Alert.alert('Success', editMode ? 'Scholarship updated successfully' : 'Scholarship created successfully');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteScholarship = async (scholarshipId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/admin/scholarships/${scholarshipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete scholarship');
      }

      setScholarships(scholarships.filter(s => s.id !== scholarshipId));
      Alert.alert('Success', 'Scholarship deleted successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderScholarshipCard = ({ item }) => (
    <View style={styles.scholarshipCard}>
      <View style={styles.scholarshipHeader}>
        <Text style={styles.scholarshipName}>{item.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? '#4CAF50' : '#FFA000' }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.scholarshipDescription}>{item.description}</Text>
      
      <View style={styles.scholarshipDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Deadline: {format(new Date(item.deadline), 'MMM dd, yyyy')}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Slots: {item.slots}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Amount: ₱{item.amount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => handleEditScholarship(item)}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => {
            Alert.alert(
              'Delete Scholarship',
              'Are you sure you want to delete this scholarship?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => handleDeleteScholarship(item.id)
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scholarship Management</Text>
        <TouchableOpacity onPress={handleAddScholarship}>
          <Ionicons name="add-circle-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="white" style={styles.loader} />
      ) : (
        <FlatList
          data={scholarships}
          renderItem={renderScholarshipCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Scholarship' : 'Add New Scholarship'}
            </Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Scholarship name"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Scholarship description"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Deadline</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(formData.deadline, 'MMM dd, yyyy')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (Platform.OS === 'android' ? (
                <DateTimePicker
                  value={formData.deadline}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({...formData, deadline: selectedDate});
                    }
                  }}
                />
              ) : (
                <DateTimePicker
                  value={formData.deadline}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setFormData({...formData, deadline: selectedDate});
                    }
                  }}
                  style={{ width: '100%' }}
                />
              ))}

              <Text style={styles.inputLabel}>Number of Slots</Text>
              <TextInput
                style={styles.input}
                value={formData.slots}
                onChangeText={(text) => setFormData({...formData, slots: text})}
                placeholder="Number of available slots"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Amount (₱)</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({...formData, amount: text})}
                placeholder="Scholarship amount"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.requirements}
                onChangeText={(text) => setFormData({...formData, requirements: text})}
                placeholder="Scholarship requirements"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Criteria</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.criteria}
                onChangeText={(text) => setFormData({...formData, criteria: text})}
                placeholder="Selection criteria"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Required Documents</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.documents}
                onChangeText={(text) => setFormData({...formData, documents: text})}
                placeholder="List of required documents"
                multiline
                numberOfLines={4}
              />

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
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editMode ? 'Update' : 'Create'}
                </Text>
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
  listContainer: {
    padding: 15,
  },
  scholarshipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  scholarshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scholarshipName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scholarshipDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  scholarshipDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    gap: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  dateButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    color: '#333',
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 