import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, BASE_URL } from '../config';

export default function ApplicationReviewScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageToView, setImageToView] = useState(null);
  const [nonImageDocUrl, setNonImageDocUrl] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/admin/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (userId, title, message, type) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          title,
          message,
          type,
          isRead: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      if (!remarks && status === 'rejected') {
        Alert.alert(
          'Remarks Required',
          'Please provide remarks explaining why the application was rejected.',
          [{ text: 'OK' }]
        );
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_URL}/admin/applications/${selectedApplication.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, remarks })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Update local state
      setApplications(applications.map(app => 
        app.id === selectedApplication.id 
          ? { ...app, status, remarks }
          : app
      ));

      // Create notification based on status
      const notificationTitle = status === 'approved' 
        ? 'Scholarship Application Approved!' 
        : 'Scholarship Application Update';

      const notificationMessage = status === 'approved'
        ? `Congratulations! Your application for ${selectedApplication.scholarshipName} has been approved.`
        : `Your application for ${selectedApplication.scholarshipName} has been ${status}. ${
            status === 'rejected' ? `Reason: ${remarks}` : ''
          }`;

      const notificationType = status === 'approved' ? 'success' : 'info';

      await createNotification(
        selectedApplication.userId,
        notificationTitle,
        notificationMessage,
        notificationType
      );

      setModalVisible(false);
      setRemarks('');
      Alert.alert(
        'Success',
        `Application ${status}. Notification sent to applicant.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Helper to check if a file is an image
  const isImageFile = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  };

  const handleViewDocument = async (documentPath) => {
    try {
      if (!documentPath) {
        Alert.alert('Error', 'Document path not found');
        return;
      }

      let documents = selectedApplication.documents;
      console.log('Raw documents value:', documents);
      if (typeof documents === 'string') {
        try {
          documents = JSON.parse(documents);
        } catch (err) {
          console.error('Error parsing documents JSON:', err);
          Alert.alert('Error', 'Invalid document data');
          return;
        }
      }
      if (!documents || typeof documents !== 'object') {
        Alert.alert('Error', 'No documents found for this application');
        return;
      }
      console.log('Parsed documents object:', documents);
      console.log('Looking for key:', documentPath);
      console.log('Available keys:', Object.keys(documents));

      const actualPath = documents[documentPath];
      if (!actualPath) {
        Alert.alert('Error', `Document not found for key: ${documentPath}. Available keys: ${Object.keys(documents).join(', ')}`);
        return;
      }

      const fullUrl = actualPath.startsWith('http') 
        ? actualPath 
        : `${BASE_URL}/${actualPath}`;

      if (isImageFile(fullUrl)) {
        setImageToView(fullUrl);
        setImageModalVisible(true);
        setNonImageDocUrl(null);
      } else {
        setNonImageDocUrl(fullUrl);
        setImageToView(null);
        setImageModalVisible(true);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#FFA000';
    }
  };

  const filteredApplications = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  const renderApplicationCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.applicationCard}
      onPress={() => {
        setSelectedApplication(item);
        setRemarks(item.remarks || '');
        setModalVisible(true);
      }}
    >
      <View style={styles.applicationHeader}>
        <View>
          <Text style={styles.applicantName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.scholarshipName}>{item.scholarshipName}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.applicationDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Applied: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.remarks && (
          <View style={styles.remarksContainer}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'all' && styles.activeFilter
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'all' && styles.activeFilterText
          ]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'pending' && styles.activeFilter
          ]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'pending' && styles.activeFilterText
          ]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'approved' && styles.activeFilter
          ]}
          onPress={() => setFilterStatus('approved')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'approved' && styles.activeFilterText
          ]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'rejected' && styles.activeFilter
          ]}
          onPress={() => setFilterStatus('rejected')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'rejected' && styles.activeFilterText
          ]}>Rejected</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="white" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationCard}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Application Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedApplication && (
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedApplication.firstName} {selectedApplication.lastName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student ID:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.studentId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.contactNumber}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Academic Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>College:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.college}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Course:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.course}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Scholarship Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scholarship:</Text>
                    <Text style={styles.detailValue}>{selectedApplication.scholarshipName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applied Date:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedApplication.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedApplication.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {selectedApplication.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Submitted Documents</Text>
                  {selectedApplication?.documents ? (
                    <View>
                      <TouchableOpacity
                        style={styles.documentItem}
                        onPress={() => handleViewDocument('reportCard')}
                      >
                        <View style={styles.documentIconContainer}>
                          <Ionicons name="document-text" size={24} color="#008000" />
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentName}>Report Card</Text>
                          <Text style={styles.documentType}>Academic Document</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#666" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.documentItem}
                        onPress={() => handleViewDocument('brgyClearance')}
                      >
                        <View style={styles.documentIconContainer}>
                          <Ionicons name="document-text" size={24} color="#008000" />
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentName}>Barangay Clearance</Text>
                          <Text style={styles.documentType}>Government Document</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#666" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.documentItem}
                        onPress={() => handleViewDocument('incomeCertificate')}
                      >
                        <View style={styles.documentIconContainer}>
                          <Ionicons name="document-text" size={24} color="#008000" />
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentName}>Income Certificate</Text>
                          <Text style={styles.documentType}>Financial Document</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.noDocuments}>
                      <Ionicons name="document-outline" size={40} color="#ccc" />
                      <Text style={styles.noDocumentsText}>No documents submitted</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Review</Text>
                  <TextInput
                    style={[
                      styles.remarksInput,
                      !remarks && styles.remarksInputRequired
                    ]}
                    placeholder={
                      "Add remarks or notes about the application...\n" +
                      "(Required for rejection, optional for approval)"
                    }
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleStatusUpdate('approved')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      { backgroundColor: '#F44336' },
                      !remarks && styles.disabledButton
                    ]}
                    onPress={() => handleStatusUpdate('rejected')}
                    disabled={!remarks}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Full-screen image or non-image modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          setImageToView(null);
          setNonImageDocUrl(null);
        }}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={() => {
                setImageModalVisible(false);
                setImageToView(null);
                setNonImageDocUrl(null);
              }}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            {imageToView ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                centerContent={true}
              >
                <Image
                  source={{ uri: imageToView }}
                  style={{
                    width: Dimensions.get('window').width * 0.9,
                    height: Dimensions.get('window').height * 0.7,
                    resizeMode: 'contain',
                    borderRadius: 10,
                  }}
                />
              </ScrollView>
            ) : nonImageDocUrl ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-outline" size={60} color="#FFA000" />
                <Text style={{ color: '#fff', fontSize: 18, marginVertical: 20, textAlign: 'center' }}>
                  Preview not available for this file type.
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#FFA000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
                  onPress={async () => {
                    try {
                      const supported = await Linking.canOpenURL(nonImageDocUrl);
                      if (supported) {
                        await Linking.openURL(nonImageDocUrl);
                      } else {
                        Alert.alert('Error', 'Cannot open this document');
                      }
                    } catch (e) {
                      Alert.alert('Error', 'Cannot open this document');
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Open Externally</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#008000',
  },
  listContainer: {
    padding: 15,
  },
  applicationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scholarshipName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  applicationDetails: {
    marginTop: 10,
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
  remarksContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 5,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: '#666',
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
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    padding: 15,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  remarksInputRequired: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
  },
  noDocuments: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  noDocumentsText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 40,
    right: 30,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
}); 