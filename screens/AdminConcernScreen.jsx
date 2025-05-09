import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';

const BASE_URL = 'http://192.168.254.101:3000';

const ResponseModalComponent = memo(({ 
  visible, 
  selectedConcern, 
  onClose, 
  onSubmit, 
  getCategoryLabel 
}) => {
  const [localResponse, setLocalResponse] = useState('');
  const [localFormat, setLocalFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (visible && selectedConcern) {
      setLocalResponse(selectedConcern.adminResponse || '');
    }
  }, [visible, selectedConcern]);

  const handleFormatChange = (format) => {
    setLocalFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const getFormattedResponse = (text) => {
    let formattedText = text;
    if (localFormat.bold) formattedText = `**${formattedText}**`;
    if (localFormat.italic) formattedText = `*${formattedText}*`;
    if (localFormat.underline) formattedText = `__${formattedText}__`;
    return formattedText;
  };

  const handleSubmit = () => {
    if (!localResponse.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }
    const formattedResponse = getFormattedResponse(localResponse);
    onSubmit(formattedResponse);
    setLocalResponse('');
    setLocalFormat({ bold: false, italic: false, underline: false });
  };

  const handleClose = () => {
    setLocalResponse('');
    setLocalFormat({ bold: false, italic: false, underline: false });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { padding: 15 }]}>
          <Text style={styles.modalTitle}>Respond to Concern</Text>
          
          {selectedConcern && (
            <View style={styles.concernDetails}>
              <Text style={styles.concernTitle}>{selectedConcern.title}</Text>
              <Text style={styles.concernMessage}>{selectedConcern.message}</Text>
              <Text style={styles.concernInfo}>
                Category: {getCategoryLabel(selectedConcern.category)}
              </Text>
              <Text style={styles.concernInfo}>
                From: {selectedConcern.firstName} {selectedConcern.lastName}
              </Text>
            </View>
          )}

          <View style={styles.formatToolbar}>
            <TouchableOpacity
              style={[
                styles.formatButton,
                localFormat.bold && styles.formatButtonActive
              ]}
              onPress={() => handleFormatChange('bold')}
            >
              <MaterialCommunityIcons
                name="format-bold"
                size={20}
                color={localFormat.bold ? '#FFA000' : 'white'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.formatButton,
                localFormat.italic && styles.formatButtonActive
              ]}
              onPress={() => handleFormatChange('italic')}
            >
              <MaterialCommunityIcons
                name="format-italic"
                size={20}
                color={localFormat.italic ? '#FFA000' : 'white'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.formatButton,
                localFormat.underline && styles.formatButtonActive
              ]}
              onPress={() => handleFormatChange('underline')}
            >
              <MaterialCommunityIcons
                name="format-underline"
                size={20}
                color={localFormat.underline ? '#FFA000' : 'white'}
              />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.responseInput,
              {
                fontWeight: localFormat.bold ? 'bold' : 'normal',
                fontStyle: localFormat.italic ? 'italic' : 'normal',
                textDecorationLine: localFormat.underline ? 'underline' : 'none',
              }
            ]}
            multiline
            numberOfLines={4}
            placeholder="Type your response here..."
            placeholderTextColor="#aaa"
            value={localResponse}
            onChangeText={setLocalResponse}
            textAlignVertical="top"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.modalButtonText}>Submit Response</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default function AdminConcernScreen({ navigation }) {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png'));
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [responseFormat, setResponseFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    loadUserData();
    fetchConcerns();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        if (parsedUserData.profileImage) {
          try {
            let imageUrl = parsedUserData.profileImage;
            if (imageUrl.includes('uploads/')) {
              imageUrl = imageUrl.substring(imageUrl.indexOf('uploads/'));
            }
            const fullImageUrl = `${BASE_URL}/${imageUrl}`;
            const imageResponse = await fetch(fullImageUrl);
            if (imageResponse.ok) {
              setProfileImage({ uri: fullImageUrl });
            } else {
              throw new Error(`Image not accessible: ${imageResponse.status}`);
            }
          } catch (error) {
            console.error('Error loading profile image:', error);
            setProfileImage(require('../assets/profile-placeholder.png'));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchConcerns = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in to view concerns');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/admin/concerns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch concerns');
      }

      const data = await response.json();
      setConcerns(data.concerns);
    } catch (error) {
      console.error('Error fetching concerns:', error);
      Alert.alert('Error', 'Failed to load concerns. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConcerns();
  };

  const handleRespond = useCallback((concern) => {
    setSelectedConcern(concern);
    setShowResponseModal(true);
  }, []);

  const handleCloseResponseModal = useCallback(() => {
    setShowResponseModal(false);
    setSelectedConcern(null);
  }, []);

  const handleStatusChange = async (newStatus) => {
    let retryCount = 0;
    const maxRetries = 3;

    const attemptUpdate = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Please log in to update status');
      }

      const response = await fetch(`${BASE_URL}/api/concerns/${selectedConcern.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminResponse: selectedConcern.adminResponse || ''
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update status');
      }

      return data;
    };

    try {
      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
          console.log('Updating status:', {
            id: selectedConcern.id,
            status: newStatus,
            adminResponse: selectedConcern.adminResponse
          });

          const result = await attemptUpdate();
          
          Alert.alert('Success', 'Status updated successfully');
          setShowStatusModal(false);
          fetchConcerns();
          return;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount === maxRetries) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    } catch (error) {
      console.error('All attempts failed:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        `Failed to update status: ${error.message}. Please try again.`
      );
    }
  };

  const handleSubmitResponse = useCallback(async (formattedResponse) => {
    let retryCount = 0;
    const maxRetries = 3;

    const attemptUpdate = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Please log in to respond');
      }

      // First, update the concern with admin response
      const response = await fetch(`${BASE_URL}/api/concerns/${selectedConcern.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'resolved',
          adminResponse: formattedResponse
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit response');
      }

      // Then, create a notification for the concern creator
      const notificationResponse = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedConcern.userId, // Send to the concern creator
          title: 'Response to Your Concern',
          message: `An admin has responded to your concern: "${selectedConcern.title}"`,
          type: 'info',
          referenceId: selectedConcern.id
        })
      });

      if (!notificationResponse.ok) {
        console.error('Failed to send notification to user');
        // We don't throw here as the main operation succeeded
      }

      return data;
    };

    try {
      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
          console.log('Submitting response:', {
            id: selectedConcern.id,
            status: 'resolved',
            adminResponse: formattedResponse
          });

          const result = await attemptUpdate();
          
          Alert.alert('Success', 'Response submitted successfully');
          setShowResponseModal(false);
          setSelectedConcern(null);
          fetchConcerns();
          return;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount === maxRetries) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    } catch (error) {
      console.error('All attempts failed:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        `Failed to submit response: ${error.message}. Please try again.`
      );
    }
  }, [selectedConcern, fetchConcerns]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#4CAF50';
      case 'in_progress': return '#FFC107';
      case 'pending': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category) => {
    const categories = {
      scholarship: 'Scholarship Information',
      application: 'Application Process',
      technical: 'Technical Issues',
      other: 'Other Concerns'
    };
    return categories[category] || category;
  };

  const getFormattedResponse = (text) => {
    let formattedText = text;
    if (responseFormat.bold) formattedText = `**${formattedText}**`;
    if (responseFormat.italic) formattedText = `*${formattedText}*`;
    if (responseFormat.underline) formattedText = `__${formattedText}__`;
    return formattedText;
  };

  const handleFormatChange = (format) => {
    setResponseFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const filteredAndSearchedConcerns = concerns.filter(concern => {
    const matchesFilter = filterStatus === 'all' || concern.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      concern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concern.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concern.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${concern.firstName} ${concern.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortConcerns = (concerns) => {
    return [...concerns].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  };

  const StatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { padding: 15 }]}>
          <Text style={styles.modalTitle}>Update Status</Text>
          
          <TouchableOpacity
            style={[styles.statusOption, { backgroundColor: getStatusColor('pending') }]}
            onPress={() => handleStatusChange('pending')}
          >
            <Text style={styles.statusOptionText}>Pending</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statusOption, { backgroundColor: getStatusColor('in_progress') }]}
            onPress={() => handleStatusChange('in_progress')}
          >
            <Text style={styles.statusOptionText}>In Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statusOption, { backgroundColor: getStatusColor('resolved') }]}
            onPress={() => handleStatusChange('resolved')}
          >
            <Text style={styles.statusOptionText}>Resolved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusOption, { 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              marginTop: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }]}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.statusOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading concerns...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <Image 
        source={require('../assets/logo.png')} 
        style={styles.bgLogo} 
        resizeMode="contain"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
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
          <Image
            source={profileImage}
            style={styles.profileImage}
          />
        </View>
      </View>

      <NotificationPopup 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <Text style={styles.heading}>User Concerns</Text>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <MaterialIcons 
            name="search" 
            size={20} 
            color={isSearchFocused ? '#FFA000' : 'rgba(255, 255, 255, 0.7)'} 
          />
          <TextInput
            style={[
              styles.searchInput,
              isSearchFocused && styles.searchInputFocused
            ]}
            placeholder="Search concerns..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
            >
              <MaterialIcons name="close" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilter]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterText, filterStatus === 'pending' && styles.activeFilterText]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'resolved' && styles.activeFilter]}
            onPress={() => setFilterStatus('resolved')}
          >
            <Text style={[styles.filterText, filterStatus === 'resolved' && styles.activeFilterText]}>
              Resolved
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              setSortBy(current => {
                if (current === 'date') return 'status';
                if (current === 'status') return 'category';
                return 'date';
              });
            }}
          >
            <MaterialIcons name="sort" size={20} color="white" />
            <Text style={styles.sortButtonText}>
              Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOrderButton}
            onPress={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
          >
            <MaterialIcons
              name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.concernsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FFA000']}
            tintColor="#FFA000"
          />
        }
      >
        {sortConcerns(filteredAndSearchedConcerns).length > 0 ? (
          sortConcerns(filteredAndSearchedConcerns).map((concern) => (
            <View key={concern.id} style={styles.concernCard}>
              <View style={styles.concernHeader}>
                <View style={styles.concernTitleContainer}>
                  <Text style={styles.concernTitle}>{concern.title}</Text>
                  <Text style={styles.concernCategory}>
                    {getCategoryLabel(concern.category)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
                  <Text style={styles.statusText}>
                    {concern.status.charAt(0).toUpperCase() + concern.status.slice(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.userInfo}>
                From: {concern.firstName} {concern.lastName}
              </Text>
              <Text style={styles.concernDate}>{formatDate(concern.createdAt)}</Text>
              <Text style={styles.concernMessage}>{concern.message}</Text>

              {concern.adminResponse && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Admin Response:</Text>
                  <Text style={styles.responseText}>{concern.adminResponse}</Text>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.statusButton]}
                  onPress={() => {
                    setSelectedConcern(concern);
                    setShowStatusModal(true);
                  }}
                >
                  <MaterialIcons name="update" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>

                {concern.status !== 'resolved' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.respondButton]}
                    onPress={() => handleRespond(concern)}
                  >
                    <MaterialIcons name="reply" size={20} color="white" />
                    <Text style={styles.actionButtonText}>
                      {concern.adminResponse ? 'Update Response' : 'Respond'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noConcernsText}>
            {searchQuery ? 'No concerns found matching your search' : 'No concerns found'}
          </Text>
        )}
      </ScrollView>

      <ResponseModalComponent
        visible={showResponseModal}
        selectedConcern={selectedConcern}
        onClose={handleCloseResponseModal}
        onSubmit={handleSubmitResponse}
        getCategoryLabel={getCategoryLabel}
      />
      <StatusModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008000'
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16
  },
  bgLogo: {
    position: 'absolute',
    width: '140%',
    height: '85%',
    opacity: 0.15,
    bottom: '8%',
    right: '-40%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  searchInputFocused: {
    borderColor: '#FFA000',
  },
  clearSearch: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#FFA000',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  concernsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  concernCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  concernTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  concernCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userInfo: {
    fontSize: 14,
    color: '#FFA000',
    marginBottom: 5,
  },
  concernDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
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
  concernMessage: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    marginBottom: 15,
  },
  responseContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFA000',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  respondButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  respondButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#008000',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  concernDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  concernInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  responseInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 3,
    zIndex: 1002,
  },
  submitButton: {
    backgroundColor: '#FFA000',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noConcernsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  sortButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  sortOrderButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  statusButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statusOption: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formatToolbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 5,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  formatButton: {
    padding: 8,
    borderRadius: 4,
  },
  formatButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 