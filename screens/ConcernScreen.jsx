import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';

const BASE_URL = 'http://192.168.254.101:3000';

export default function ConcernScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [concern, setConcern] = useState('');
  const [category, setCategory] = useState('');
  const [submittedConcerns, setSubmittedConcerns] = useState([]);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [hasNewResponses, setHasNewResponses] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const lastDataRef = useRef(null);

  const categories = [
    { id: 'scholarship', label: 'Scholarship Information' },
    { id: 'application', label: 'Application Process' },
    { id: 'technical', label: 'Technical Issues' },
    { id: 'other', label: 'Other Concerns' }
  ];

  const fetchConcerns = useCallback(async (isPolling = false) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in to view your concerns');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/concerns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch concerns');
      }

      const data = await response.json();
      
      const currentDataString = JSON.stringify(data);
      const hasChanges = currentDataString !== lastDataRef.current;

      if (!isPolling || hasChanges) {
        if (hasChanges) {
          console.log('Concerns updated:', new Date().toLocaleTimeString());
          setHasNewResponses(true);
        }
        setSubmittedConcerns(data);
        setLastUpdate(new Date().toISOString());
        lastDataRef.current = currentDataString;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching concerns:', error);
      if (!submittedConcerns.length) {
        Alert.alert('Error', 'Failed to load your concerns. Please try again.');
      }
      setLoading(false);
    }
  }, [submittedConcerns.length]);

  useFocusEffect(
    useCallback(() => {
      fetchConcerns(false);

      const interval = setInterval(() => {
        fetchConcerns(true);
      }, 10000);

      setPollingInterval(interval);

      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      };
    }, [fetchConcerns])
  );

  useEffect(() => {
    loadUserData();
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
            console.log('Concerns - Setting profile image URL:', fullImageUrl);
            
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
        } else {
          console.log('No profile image URL found, using default');
          setProfileImage(require('../assets/profile-placeholder.png'));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setProfileImage(require('../assets/profile-placeholder.png'));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title for your concern');
        return;
      }

      if (!concern.trim()) {
        Alert.alert('Error', 'Please describe your concern');
        return;
      }

      if (!category) {
        Alert.alert('Error', 'Please select a category for your concern');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in to submit a concern');
        return;
      }

      setLoading(true);

      console.log('Submitting concern:', {
        title,
        message: concern,
        category
      });

      const response = await fetch(`${BASE_URL}/api/concerns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          message: concern,
          category
        })
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to submit concern');
      }

      setTitle('');
      setConcern('');
      setCategory('');

      Alert.alert('Success', 'Your concern has been submitted successfully!');
      
      fetchConcerns();
    } catch (error) {
      console.error('Error submitting concern:', error);
      console.error('Error details:', error.message);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit concern. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = async (concern) => {
    setSelectedConcern(concern);
    setShowResponseModal(true);
    setHasNewResponses(false);
    
    if (concern.adminResponse && !concern.isRead) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        await fetch(`${BASE_URL}/api/concerns/${concern.id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setSubmittedConcerns(prevConcerns =>
          prevConcerns.map(c =>
            c.id === concern.id ? { ...c, isRead: true } : c
          )
        );
      } catch (error) {
        console.error('Error marking concern as read:', error);
      }
    }
  };

  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.categoryModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
          </View>

          <ScrollView style={styles.categoryList}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  category === cat.id && styles.selectedCategory
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  setShowCategoryModal(false);
                }}
              >
                <MaterialIcons 
                  name={getCategoryIcon(cat.id)} 
                  size={24} 
                  color={category === cat.id ? '#FFA000' : 'white'} 
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryOptionText,
                  category === cat.id && styles.selectedCategoryText
                ]}>
                  {cat.label}
                </Text>
                {category === cat.id && (
                  <MaterialIcons 
                    name="check-circle" 
                    size={24} 
                    color="#FFA000" 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'scholarship':
        return 'school';
      case 'application':
        return 'description';
      case 'technical':
        return 'computer';
      case 'other':
        return 'help-outline';
      default:
        return 'folder';
    }
  };

  const ResponseDetailModal = () => (
    <Modal
      visible={showResponseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowResponseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Concern Details</Text>
          </View>
          
          {selectedConcern && (
            <ScrollView style={styles.responseModalContent}>
              <View style={styles.concernSummary}>
                <Text style={styles.concernSummaryTitle}>{selectedConcern.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedConcern.status) }]}>
                  <Text style={styles.statusText}>
                    {selectedConcern.status.charAt(0).toUpperCase() + selectedConcern.status.slice(1).replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.concernSummaryDate}>
                  Submitted {formatDate(selectedConcern.createdAt)}
                </Text>
                <Text style={styles.concernSummaryMessage}>{selectedConcern.message}</Text>
              </View>

              {selectedConcern.adminResponse ? (
                <View style={styles.adminResponseDetail}>
                  <View style={styles.responseHeader}>
                    <MaterialIcons name="admin-panel-settings" size={24} color="#FFA000" />
                    <Text style={styles.responseHeaderText}>Admin Response</Text>
                    <Text style={styles.responseDate}>
                      • {formatDate(selectedConcern.updatedAt)}
                    </Text>
                  </View>
                  <Text style={styles.adminResponseText}>{selectedConcern.adminResponse}</Text>
                </View>
              ) : (
                <View style={styles.awaitingResponse}>
                  <MaterialIcons name="hourglass-empty" size={24} color="#FFA000" />
                  <Text style={styles.awaitingResponseText}>Awaiting admin response...</Text>
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowResponseModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#4CAF50';
      case 'in_progress': return '#FFC107';
      case 'pending': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

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
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#00AA00',
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginTop: 20,
    },
    description: {
      fontSize: 15,
      color: 'white',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
    formContainer: {
      paddingHorizontal: 20,
      marginBottom: 25,
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 10,
      padding: 15,
      color: 'white',
      fontSize: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    categorySelector: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 15,
      padding: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryText: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    placeholderText: {
      color: 'rgba(255, 255, 255, 0.5)',
    },
    submitButton: {
      backgroundColor: '#FFA000',
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    concernsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    concernsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
    },
    newResponsesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFA000',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      elevation: 3,
    },
    newResponsesBadgeText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 6,
    },
    concernCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 15,
      marginBottom: 15,
      overflow: 'hidden',
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
      elevation: 2,
    },
    respondedConcernCard: {
      borderLeftColor: '#4CAF50',
    },
    concernCardContent: {
      padding: 16,
    },
    concernHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    concernTitleContainer: {
      flex: 1,
      marginRight: 12,
    },
    concernTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 6,
    },
    concernCategory: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      marginRight: 6,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      elevation: 1,
    },
    statusText: {
      fontSize: 13,
      color: 'white',
      fontWeight: 'bold',
    },
    concernDate: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 10,
      fontStyle: 'italic',
    },
    concernMessage: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 22,
      marginBottom: 12,
    },
    responsePreview: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      padding: 15,
      borderRadius: 12,
      marginTop: 10,
    },
    awaitingResponse: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      padding: 12,
      borderRadius: 12,
      marginTop: 10,
    },
    awaitingResponseText: {
      color: '#FFA000',
      fontSize: 14,
      marginLeft: 8,
      fontWeight: '500',
    },
    responseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    responseHeaderText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#FFA000',
      marginLeft: 8,
    },
    responseDate: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.6)',
      marginLeft: 8,
    },
    responsePreviewText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 20,
    },
    viewDetailsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    viewFullResponse: {
      color: '#FFA000',
      fontSize: 13,
      marginLeft: 6,
      fontWeight: '500',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 10,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 5,
      borderRadius: 25,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      elevation: 2,
    },
    activeTab: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tabText: {
      color: 'rgba(255, 255, 255, 0.8)',
      marginLeft: 8,
      fontSize: 15,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#FFA000',
      fontWeight: 'bold',
    },
    notificationDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFA000',
      borderWidth: 2,
      borderColor: '#007000',
    },
    responseIcon: {
      marginLeft: 8,
    },
    noConcernsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: '#006500',
      width: '100%',
      maxHeight: '90%',
      borderRadius: 20,
      elevation: 5,
      overflow: 'hidden',
    },
    modalHeader: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
    },
    responseModalContent: {
      padding: 20,
    },
    concernSummary: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 15,
      padding: 20,
      marginBottom: 20,
    },
    concernSummaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 10,
    },
    adminResponseDetail: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 15,
      padding: 20,
    },
    adminResponseText: {
      fontSize: 15,
      color: 'white',
      lineHeight: 24,
    },
    categoryModalContent: {
      maxHeight: '70%',
      width: '90%',
      position: 'relative',
    },
    categoryList: {
      padding: 20,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 15,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectedCategory: {
      backgroundColor: 'rgba(255, 160, 0, 0.15)',
      borderColor: '#FFA000',
    },
    categoryOptionText: {
      flex: 1,
      fontSize: 16,
      color: 'white',
      fontWeight: '500',
    },
    selectedCategoryText: {
      color: '#FFA000',
      fontWeight: 'bold',
    },
    checkIcon: {
      marginLeft: 8,
    },
    modalCloseButton: {
      position: 'absolute',
      top: 18,
      right: 16,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
  });

  const renderConcernCard = useCallback((item) => (
    <TouchableOpacity 
      key={item.id} 
      style={[
        styles.concernCard,
        item.adminResponse && styles.respondedConcernCard
      ]}
      onPress={() => handleViewResponse(item)}
    >
      <View style={styles.concernCardContent}>
        <View style={styles.concernHeader}>
          <View style={styles.concernTitleContainer}>
            <Text style={styles.concernTitle}>
              {item.title}
            </Text>
            <View style={styles.concernCategory}>
              <MaterialIcons 
                name={getCategoryIcon(item.category)} 
                size={16} 
                color="rgba(255, 255, 255, 0.8)" 
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryText}>
                {categories.find(cat => cat.id === item.category)?.label}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.concernDate}>
          Submitted {formatDate(item.createdAt)}
        </Text>

        <Text style={styles.concernMessage} numberOfLines={2}>
          {item.message}
        </Text>

        {item.adminResponse ? (
          <View style={styles.responsePreview}>
            <View style={styles.responseHeader}>
              <MaterialIcons name="admin-panel-settings" size={20} color="#FFA000" />
              <Text style={styles.responseHeaderText}>Admin Response</Text>
              <Text style={styles.responseDate}>
                • {formatDate(item.updatedAt)}
              </Text>
            </View>
            <Text style={styles.responsePreviewText} numberOfLines={2}>
              {item.adminResponse}
            </Text>
            <View style={styles.viewDetailsContainer}>
              <MaterialIcons name="touch-app" size={16} color="#FFA000" />
              <Text style={styles.viewFullResponse}>
                Tap to view full conversation
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.awaitingResponse}>
            <MaterialIcons name="hourglass-empty" size={16} color="#FFA000" />
            <Text style={styles.awaitingResponseText}>Awaiting response...</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [handleViewResponse, categories, formatDate, getCategoryIcon, getStatusColor]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading your concerns...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={32} color="white" />
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <TouchableOpacity 
              onPress={() => setShowNotifications(!showNotifications)}
              style={styles.notificationButton}
            >
              <Ionicons 
                name={showNotifications ? "notifications" : "notifications-outline"} 
                size={26} 
                color="white" 
              />
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

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, !showSubmitForm && styles.activeTab]}
            onPress={() => setShowSubmitForm(false)}
          >
            <MaterialCommunityIcons 
              name="message-text" 
              size={24} 
              color={!showSubmitForm ? '#FFA000' : 'white'} 
            />
            <Text style={[styles.tabText, !showSubmitForm && styles.activeTabText]}>
              My Concerns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, showSubmitForm && styles.activeTab]}
            onPress={() => setShowSubmitForm(true)}
          >
            <MaterialCommunityIcons 
              name="message-plus" 
              size={24} 
              color={showSubmitForm ? '#FFA000' : 'white'} 
            />
            <Text style={[styles.tabText, showSubmitForm && styles.activeTabText]}>
              Submit New
            </Text>
          </TouchableOpacity>
        </View>

        {showSubmitForm ? (
          <View style={styles.formContainer}>
            <Text style={styles.heading}>Submit a New Concern</Text>
            <Text style={styles.description}>
              Have questions about scholarships or need assistance? We're here to help!
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Title of your concern"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={title}
              onChangeText={setTitle}
            />

            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.categoryText, !category && styles.placeholderText]}>
                {category ? categories.find(cat => cat.id === category)?.label : 'Select a category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Describe your concern in detail..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={concern}
              onChangeText={setConcern}
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit Concern</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.concernsContainer}>
            <View style={styles.concernsHeader}>
              <Text style={styles.sectionTitle}>Your Concerns & Responses</Text>
            </View>

            {submittedConcerns.length > 0 ? (
              submittedConcerns.map(renderConcernCard)
            ) : (
              <View style={styles.noConcernsContainer}>
                <MaterialCommunityIcons name="message-text-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.noConcernsText}>No concerns submitted yet</Text>
                <TouchableOpacity 
                  style={styles.submitFirstButton}
                  onPress={() => setShowSubmitForm(true)}
                >
                  <Text style={styles.submitFirstButtonText}>Submit Your First Concern</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <CategoryModal />
        <ResponseDetailModal />
      </View>
    </ScrollView>
  );
}