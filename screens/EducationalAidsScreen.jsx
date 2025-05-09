import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';
import NotificationBadge from '../components/NotificationBadge';
import { format } from 'date-fns';

const BASE_URL = 'http://192.168.254.101:3000';

export default function EducationalAidsScreen({ route }) {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('available');
  const [currentStep, setCurrentStep] = useState(0); // Step 0 is scholarship selection
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png')); // Default image
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableScholarships, setAvailableScholarships] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReapplication, setIsReapplication] = useState(false);
  const [previousApplicationId, setPreviousApplicationId] = useState(null);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const userDataString = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!userDataString || !token) {
        console.log('No user data or token found');
        navigation.navigate('Login');
        return;
      }

      const parsedUserData = JSON.parse(userDataString);
      console.log('Loaded user data:', parsedUserData);
      
      if (!parsedUserData || !parsedUserData.id) {
        console.log('Invalid user data format');
        navigation.navigate('Login');
        return;
      }

      setUserData(parsedUserData);
      setFormData(prev => ({
        ...prev,
        userId: parsedUserData.id,
        personalInfo: {
          firstName: parsedUserData.firstName || '',
          lastName: parsedUserData.lastName || '',
          email: parsedUserData.email || '',
          phone: parsedUserData.phone || ''
        }
      }));

      if (parsedUserData.profileImage) {
        try {
          // Clean up the URL path by removing any absolute path references
          let imageUrl = parsedUserData.profileImage;
          if (imageUrl.includes('uploads/')) {
            // Extract just the uploads part of the path
            imageUrl = imageUrl.substring(imageUrl.indexOf('uploads/'));
          }
          
          // Construct the full URL
          const fullImageUrl = `${BASE_URL}/${imageUrl}`;
          console.log('Educational Aids - Setting profile image URL:', fullImageUrl);
          
          // Test if image is accessible
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
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
      navigation.navigate('Login');
    } finally {
      setIsLoadingUser(false);
      setIsInitializing(false);
    }
  }, [navigation]);

  const fetchUserApplications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found for fetching applications');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/user/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user applications');
      }

      const data = await response.json();
      setUserApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch scholarships
      const response = await fetch(`${BASE_URL}/api/scholarships`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scholarships');
      }

      const data = await response.json();
      
      // Fetch user applications to check which scholarships user has already applied for
      await fetchUserApplications();
      
      // Mark scholarships that have already been applied for or approved
      const scholarshipsWithStatus = data.map(scholarship => {
        const existingApplication = userApplications.find(app => app.scholarshipId === scholarship.id);
        return {
          ...scholarship,
          hasApplied: !!existingApplication,
          applicationStatus: existingApplication?.status || null,
          canReapply: existingApplication?.status === 'rejected', // Only allow reapplication if rejected
          isDisabled: existingApplication && existingApplication.status !== 'rejected' // Disable if already applied and not rejected
        };
      });

      setAvailableScholarships(scholarshipsWithStatus);
      setError(null);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkReapplicationData = async () => {
    try {
      const reapplyDataString = await AsyncStorage.getItem('reapplyData');
      if (reapplyDataString) {
        const reapplyData = JSON.parse(reapplyDataString);
        setIsReapplication(true);
        setPreviousApplicationId(reapplyData.previousApplication.previousApplicationId);
        
        // Pre-select the scholarship
        const scholarship = availableScholarships.find(s => s.id === reapplyData.scholarshipId);
        if (scholarship) {
          setSelectedScholarship(scholarship);
          setFormData(prev => ({
            ...prev,
            scholarshipId: scholarship.id,
            previousApplicationId: reapplyData.previousApplication.previousApplicationId,
            isReapplication: true
          }));
        }

        // Switch to apply tab
        setActiveTab('apply');

        // Clean up the stored data
        await AsyncStorage.removeItem('reapplyData');
      }
    } catch (error) {
      console.error('Error checking reapplication data:', error);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      await loadUserData();
      await fetchScholarships();
      await checkReapplicationData();
    };
    initializeScreen();
  }, [loadUserData]);

  // Form state
  const [formData, setFormData] = useState({
    scholarshipId: null,
    userId: null,
    status: 'pending',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    residency: {
      address: '',
      city: '',
      yearsResiding: ''
    },
    familyBackground: {
      parentsStatus: '',
      siblings: '',
      householdIncome: ''
    },
    documents: {
      reportCard: null,
      brgyClearance: null,
      incomeCertificate: null,
      otherDocuments: []
    },
    remarks: '',
    submissionDate: new Date()
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const pickDocument = async (field) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [field]: result.assets[0]
          }
        }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      handleInputChange('appointment', 'date', selectedDate);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      if (!formData.scholarshipId || !formData.userId) {
        Alert.alert('Error', 'Please select a scholarship to apply for');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in to apply for scholarships');
        return;
      }

      // Validate required documents
      if (!formData.documents.reportCard || 
          !formData.documents.brgyClearance || 
          !formData.documents.incomeCertificate) {
        Alert.alert('Error', 'Please upload all required documents');
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add files with proper file information
      if (formData.documents.reportCard) {
        formDataToSend.append('reportCard', {
          uri: formData.documents.reportCard.uri,
          type: formData.documents.reportCard.mimeType || 'application/octet-stream',
          name: formData.documents.reportCard.name
        });
      }

      if (formData.documents.brgyClearance) {
        formDataToSend.append('brgyClearance', {
          uri: formData.documents.brgyClearance.uri,
          type: formData.documents.brgyClearance.mimeType || 'application/octet-stream',
          name: formData.documents.brgyClearance.name
        });
      }

      if (formData.documents.incomeCertificate) {
        formDataToSend.append('incomeCertificate', {
          uri: formData.documents.incomeCertificate.uri,
          type: formData.documents.incomeCertificate.mimeType || 'application/octet-stream',
          name: formData.documents.incomeCertificate.name
        });
      }

      // Add other data
      formDataToSend.append('scholarshipId', formData.scholarshipId.toString());
      formDataToSend.append('userId', formData.userId.toString());
      formDataToSend.append('status', 'pending');
      formDataToSend.append('remarks', formData.remarks || '');

      // Add reapplication data if this is a reapplication
      if (isReapplication) {
        formDataToSend.append('isReapplication', 'true');
        formDataToSend.append('previousApplicationId', previousApplicationId.toString());
      }

      console.log('Submitting application data:', formDataToSend);

      const response = await fetch(`${BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      // Log the response for debugging
      const responseText = await response.text();
      console.log('Server response:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned invalid response format');
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit application');
      }

      // Send notification to admin
      const adminNotificationResponse = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 1, // Admin user ID (assuming admin has ID 1)
          title: 'New Scholarship Application',
          message: `A new application has been submitted for ${selectedScholarship.name} by ${userData.firstName} ${userData.lastName}`,
          type: 'info'
        })
      });

      if (!adminNotificationResponse.ok) {
        console.error('Failed to send admin notification');
      }

      Alert.alert(
        'Success',
        'Your application has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentStep(0);
              setActiveTab('available');
              setSelectedScholarship(null);
              setFormData({
                scholarshipId: null,
                userId: userData?.id || null,
                status: 'pending',
                personalInfo: {
                  firstName: userData?.firstName || '',
                  lastName: userData?.lastName || '',
                  email: userData?.email || '',
                  phone: userData?.phone || ''
                },
                residency: {
                  address: '',
                  city: '',
                  yearsResiding: ''
                },
                familyBackground: {
                  parentsStatus: '',
                  siblings: '',
                  householdIncome: ''
                },
                documents: {
                  reportCard: null,
                  brgyClearance: null,
                  incomeCertificate: null,
                  otherDocuments: []
                },
                remarks: '',
                submissionDate: new Date()
              });

              // Reset reapplication state after successful submission
              setIsReapplication(false);
              setPreviousApplicationId(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
    }
  };

  const renderStep = () => {
    // Guard clause for required data
    if (!userData || !userData.id) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.errorText}>Please log in to continue</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {isReapplication ? 'Update Previous Application' : 'Select Scholarship to Apply For'}
            </Text>
            {isReapplication && (
              <View style={styles.reapplicationNote}>
                <Ionicons name="information-circle" size={20} color="#FFA000" />
                <Text style={styles.reapplicationText}>
                  You are updating a previous application. Please review and update your information based on the feedback received.
                </Text>
              </View>
            )}
            {availableScholarships.map(scholarship => (
              <View 
                key={scholarship.id} 
                style={[
                  styles.scholarshipCard,
                  scholarship.hasApplied && styles.appliedScholarshipCard,
                  scholarship.applicationStatus === 'approved' && styles.approvedScholarshipCard
                ]}
              >
                {scholarship.hasApplied && (
                  <View style={[
                    styles.appliedBadge,
                    { backgroundColor: scholarship.applicationStatus === 'approved' ? '#4CAF50' : 
                                    scholarship.applicationStatus === 'rejected' ? '#F44336' : '#FFA000' }
                  ]}>
                    <Text style={styles.appliedBadgeText}>
                      {scholarship.applicationStatus === 'approved' ? 'Approved' :
                       scholarship.applicationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </Text>
                  </View>
                )}
                <Text style={styles.scholarshipName}>{scholarship.name}</Text>
                <Text style={styles.scholarshipAmount}>Amount: ₱{scholarship.amount?.toLocaleString()}</Text>
                <Text style={styles.scholarshipDeadline}>
                  Deadline: {scholarship.deadline ? format(new Date(scholarship.deadline), 'MMM dd, yyyy') : 'Not specified'}
                </Text>
                <Text style={styles.scholarshipRequirements}>Requirements: {scholarship.requirements}</Text>
                {scholarship.description && (
                  <Text style={styles.scholarshipDescription}>{scholarship.description}</Text>
                )}
                <TouchableOpacity 
                  style={[
                    styles.applyButton,
                    (scholarship.hasApplied && !scholarship.canReapply) && styles.alreadyAppliedButton,
                    scholarship.applicationStatus === 'approved' && styles.approvedButton,
                    (scholarship.status !== 'active' || scholarship.isDisabled) && styles.disabledApplyButton
                  ]}
                  onPress={() => {
                    if ((scholarship.status === 'active' && !scholarship.hasApplied) || 
                        (scholarship.hasApplied && scholarship.canReapply)) {
                      setActiveTab('apply');
                      setSelectedScholarship(scholarship);
                      setFormData(prev => ({
                        ...prev,
                        scholarshipId: scholarship.id
                      }));
                    }
                  }}
                  disabled={scholarship.status !== 'active' || 
                          (scholarship.hasApplied && !scholarship.canReapply) ||
                          scholarship.applicationStatus === 'approved' ||
                          scholarship.isDisabled}
                >
                  <Text style={styles.applyButtonText}>
                    {scholarship.applicationStatus === 'approved' ? 'Already Approved' :
                     scholarship.applicationStatus === 'rejected' ? 'Reapply' :
                     scholarship.hasApplied ? 'Application Pending' : 'Apply Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.nextButton,
                  !selectedScholarship && styles.disabledButton
                ]}
                onPress={() => selectedScholarship && setCurrentStep(1)}
                disabled={!selectedScholarship}
              >
                <Text style={styles.buttonText}>Next: Personal Information</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1: // Personal Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.selectedScholarshipText}>
              Applying for: {selectedScholarship.name}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={formData.personalInfo.firstName}
              onChangeText={(text) => handleInputChange('personalInfo', 'firstName', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={formData.personalInfo.lastName}
              onChangeText={(text) => handleInputChange('personalInfo', 'lastName', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.personalInfo.email}
              onChangeText={(text) => handleInputChange('personalInfo', 'email', text)}
              keyboardType="email-address"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.personalInfo.phone}
              onChangeText={(text) => handleInputChange('personalInfo', 'phone', text)}
              keyboardType="phone-pad"
              placeholderTextColor="#aaa"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(0)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.buttonText}>Next: Residency Information</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2: // Residency Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Residency Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Complete Address"
              value={formData.residency.address}
              onChangeText={(text) => handleInputChange('residency', 'address', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="City/Municipality"
              value={formData.residency.city}
              onChangeText={(text) => handleInputChange('residency', 'city', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Years Residing in Current Address"
              value={formData.residency.yearsResiding}
              onChangeText={(text) => handleInputChange('residency', 'yearsResiding', text)}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.buttonText}>Next: Family Background</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: // Family Background
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Family Background</Text>
            <TextInput
              style={styles.input}
              placeholder="Parents' Marital Status"
              value={formData.familyBackground.parentsStatus}
              onChangeText={(text) => handleInputChange('familyBackground', 'parentsStatus', text)}
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Number of Siblings"
              value={formData.familyBackground.siblings}
              onChangeText={(text) => handleInputChange('familyBackground', 'siblings', text)}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              placeholder="Monthly Household Income"
              value={formData.familyBackground.householdIncome}
              onChangeText={(text) => handleInputChange('familyBackground', 'householdIncome', text)}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]}
                onPress={() => setCurrentStep(4)}
              >
                <Text style={styles.buttonText}>Next: Document Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4: // Document Upload
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Required Documents</Text>
            <Text style={styles.documentNote}>Please upload clear scanned copies or photos of the following documents:</Text>
            
            <TouchableOpacity 
              style={[
                styles.documentButton,
                formData.documents.reportCard && styles.documentButtonUploaded
              ]}
              onPress={() => pickDocument('reportCard')}
            >
              <Ionicons 
                name={formData.documents.reportCard ? "checkmark-circle" : "cloud-upload"} 
                size={24} 
                color={formData.documents.reportCard ? "#4CAF50" : "#666"} 
              />
              <Text style={[
                styles.documentButtonText,
                formData.documents.reportCard && styles.documentButtonTextUploaded
              ]}>
                {formData.documents.reportCard ? 'Report Card Uploaded' : 'Upload Report Card'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.documentButton,
                formData.documents.brgyClearance && styles.documentButtonUploaded
              ]}
              onPress={() => pickDocument('brgyClearance')}
            >
              <Ionicons 
                name={formData.documents.brgyClearance ? "checkmark-circle" : "cloud-upload"} 
                size={24} 
                color={formData.documents.brgyClearance ? "#4CAF50" : "#666"} 
              />
              <Text style={[
                styles.documentButtonText,
                formData.documents.brgyClearance && styles.documentButtonTextUploaded
              ]}>
                {formData.documents.brgyClearance ? 'Barangay Clearance Uploaded' : 'Upload Barangay Clearance'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.documentButton,
                formData.documents.incomeCertificate && styles.documentButtonUploaded
              ]}
              onPress={() => pickDocument('incomeCertificate')}
            >
              <Ionicons 
                name={formData.documents.incomeCertificate ? "checkmark-circle" : "cloud-upload"} 
                size={24} 
                color={formData.documents.incomeCertificate ? "#4CAF50" : "#666"} 
              />
              <Text style={[
                styles.documentButtonText,
                formData.documents.incomeCertificate && styles.documentButtonTextUploaded
              ]}>
                {formData.documents.incomeCertificate ? 'Income Certificate Uploaded' : 'Upload Income Certificate'}
              </Text>
            </TouchableOpacity>

            {selectedScholarship?.documents && (
              <Text style={styles.additionalRequirements}>
                Additional Requirements: {selectedScholarship.documents}
              </Text>
            )}
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.nextButton, (!formData.documents.reportCard || 
                 !formData.documents.brgyClearance || 
                 !formData.documents.incomeCertificate) && styles.disabledButton]}
                onPress={() => {
                  if (formData.documents.reportCard && 
                      formData.documents.brgyClearance && 
                      formData.documents.incomeCertificate) {
                    setCurrentStep(5);
                  } else {
                    Alert.alert('Required Documents', 'Please upload all required documents before proceeding.');
                  }
                }}
                disabled={!formData.documents.reportCard || 
                         !formData.documents.brgyClearance || 
                         !formData.documents.incomeCertificate}
              >
                <Text style={styles.buttonText}>Next: Review & Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Review & Submit
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review & Submit Application</Text>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Selected Scholarship</Text>
              <Text style={styles.reviewText}>{selectedScholarship?.name || 'N/A'}</Text>
              <Text style={styles.reviewAmount}>
                Amount: ₱{selectedScholarship?.amount?.toLocaleString() || '0'}
              </Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Applicant Information</Text>
              <Text style={styles.reviewText}>
                Name: {userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'}
              </Text>
              <Text style={styles.reviewText}>
                Student ID: {userData?.studentId || 'N/A'}
              </Text>
              <Text style={styles.reviewText}>
                Course: {userData?.course || 'N/A'}
              </Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Uploaded Documents</Text>
              <Text style={styles.reviewText}>
                {formData.documents.reportCard ? '✓' : '❌'} Report Card
              </Text>
              <Text style={styles.reviewText}>
                {formData.documents.brgyClearance ? '✓' : '❌'} Barangay Clearance
              </Text>
              <Text style={styles.reviewText}>
                {formData.documents.incomeCertificate ? '✓' : '❌'} Income Certificate
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(4)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmitApplication}
              >
                <Text style={styles.buttonText}>Submit Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (isInitializing || isLoadingUser || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
        <ActivityIndicator size="large" color="#FFA000" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
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

        <Text style={styles.heading}>Educational Aids</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'available' && styles.activeTab]}
            onPress={() => {
              setActiveTab('available');
              setCurrentStep(0);
              setSelectedScholarship(null);
            }}
          >
            <Text style={styles.tabText}>Available Scholarships</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'apply' && styles.activeTab]}
            onPress={() => setActiveTab('apply')}
          >
            <Text style={styles.tabText}>Apply Now</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'available' ? (
          <View style={styles.scholarshipsContainer}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#FFA000" />
                <Text style={styles.loadingText}>Loading scholarships...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContent}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchScholarships}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : availableScholarships.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={styles.noDataText}>No scholarships available at the moment.</Text>
              </View>
            ) : (
              availableScholarships.map(scholarship => (
                <View 
                  key={scholarship.id} 
                  style={[
                    styles.scholarshipCard,
                    scholarship.hasApplied && styles.appliedScholarshipCard
                  ]}
                >
                  {scholarship.hasApplied && (
                    <View style={styles.appliedBadge}>
                      <Text style={styles.appliedBadgeText}>Applied</Text>
                    </View>
                  )}
                  <Text style={styles.scholarshipName}>{scholarship.name}</Text>
                  <Text style={styles.scholarshipAmount}>Amount: ₱{scholarship.amount?.toLocaleString()}</Text>
                  <Text style={styles.scholarshipDeadline}>
                    Deadline: {scholarship.deadline ? format(new Date(scholarship.deadline), 'MMM dd, yyyy') : 'Not specified'}
                  </Text>
                  <Text style={styles.scholarshipRequirements}>Requirements: {scholarship.requirements}</Text>
                  {scholarship.description && (
                    <Text style={styles.scholarshipDescription}>{scholarship.description}</Text>
                  )}
                  <TouchableOpacity 
                    style={[
                      styles.applyButton,
                      (scholarship.hasApplied && !scholarship.canReapply) && styles.alreadyAppliedButton,
                      scholarship.applicationStatus === 'approved' && styles.approvedButton,
                      (scholarship.status !== 'active' || scholarship.isDisabled) && styles.disabledApplyButton
                    ]}
                    onPress={() => {
                      if ((scholarship.status === 'active' && !scholarship.hasApplied) || 
                          (scholarship.hasApplied && scholarship.canReapply)) {
                        setActiveTab('apply');
                        setSelectedScholarship(scholarship);
                        setFormData(prev => ({
                          ...prev,
                          scholarshipId: scholarship.id
                        }));
                      }
                    }}
                    disabled={scholarship.status !== 'active' || 
                            (scholarship.hasApplied && !scholarship.canReapply) ||
                            scholarship.applicationStatus === 'approved' ||
                            scholarship.isDisabled}
                  >
                    <Text style={styles.applyButtonText}>
                      {scholarship.applicationStatus === 'approved' ? 'Already Approved' :
                       scholarship.applicationStatus === 'rejected' ? 'Reapply' :
                       scholarship.hasApplied ? 'Application Pending' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.applicationContainer}>
            <Text style={styles.currentStep}>
              {currentStep === 0 ? 'Select Scholarship' : `Step ${currentStep} of 5`}
            </Text>
            {renderStep()}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#008000' },
  gradient: { ...StyleSheet.absoluteFillObject },
  bgLogo: {
    position: 'absolute',
    width: '140%',
    height: '85%',
    resizeMode: 'contain',
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
    marginBottom: 10,
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
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scholarshipsContainer: {
    paddingHorizontal: 20,
  },
  scholarshipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scholarshipName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scholarshipAmount: {
    fontSize: 16,
    color: '#FFA000',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scholarshipDeadline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  scholarshipRequirements: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  applyButton: {
    backgroundColor: '#FFA000',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  disabledApplyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  alreadyAppliedButton: {
    backgroundColor: '#4CAF50',
    opacity: 0.7,
  },
  appliedScholarshipCard: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  appliedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appliedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  applicationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  currentStep: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    padding: 12,
    color: 'white',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  documentNote: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  documentButtonUploaded: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  documentButtonText: {
    color: 'white',
    marginLeft: 10,
  },
  documentButtonTextUploaded: {
    color: '#4CAF50',
  },
  additionalRequirements: {
    color: '#FFA000',
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  reviewSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
  },
  reviewTitle: {
    color: '#FFA000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewText: {
    color: 'white',
    marginBottom: 5,
  },
  reviewAmount: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButton: {
    backgroundColor: '#FFA000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  scholarshipDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  selectedScholarshipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#008000',
  },
  loginButton: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reapplicationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
  },
  reapplicationText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
    fontSize: 13,
  },
  approvedScholarshipCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  approvedButton: {
    backgroundColor: '#4CAF50',
    opacity: 0.7,
  },
});