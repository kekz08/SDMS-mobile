import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPopup from '../components/NotificationPopup';

const BASE_URL = 'http://192.168.254.101:3000';

export default function EducationalAidsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('available');
  const [currentStep, setCurrentStep] = useState(0); // Step 0 is scholarship selection
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [profileImage, setProfileImage] = useState(require('../assets/profile-placeholder.png')); // Default image
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const parsedUserData = JSON.parse(userDataString);
        if (parsedUserData.profileImage) {
          // Check if the profileImage is a relative path
          const imageUrl = parsedUserData.profileImage.startsWith('http') 
            ? parsedUserData.profileImage 
            : `${BASE_URL}/${parsedUserData.profileImage}`;
          console.log('Educational Aids - Setting profile image URL:', imageUrl);
          setProfileImage({ uri: imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Available scholarships data
  const availableScholarships = [
    {
      id: 1,
      name: 'Academic Excellence Scholarship',
      deadline: 'April 24, 2024',
      requirements: 'GWA of 1.5 or better, No failing grades'
    },
    {
      id: 2,
      name: 'Financial Assistance Grant',
      deadline: 'April 14, 2024',
      requirements: 'Family income below 20,000/month'
    },
    {
      id: 3,
      name: 'Special Talent Scholarship',
      deadline: 'April 2, 2024',
      requirements: 'Proof of competition participation'
    }
  ];

  // Form state
  const [formData, setFormData] = useState({
    scholarshipId: null,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    residency: {
      address: '',
      city: '',
      yearsResiding: '',
    },
    familyBackground: {
      parentsStatus: '',
      siblings: '',
      householdIncome: '',
    },
    documents: {
      reportCard: null,
      brgyClearance: null,
      incomeCertificate: null,
    },
    appointment: {
      date: new Date(),
      time: '',
    }
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

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Scholarship selection step
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Scholarship to Apply For</Text>
            {availableScholarships.map(scholarship => (
              <TouchableOpacity
                key={scholarship.id}
                style={[
                  styles.scholarshipOption,
                  selectedScholarship?.id === scholarship.id && styles.selectedScholarship
                ]}
                onPress={() => {
                  setSelectedScholarship(scholarship);
                  setFormData(prev => ({
                    ...prev,
                    scholarshipId: scholarship.id
                  }));
                }}
              >
                <Text style={styles.scholarshipOptionName}>{scholarship.name}</Text>
                <Text style={styles.scholarshipOptionDetails}>Deadline: {scholarship.deadline}</Text>
                <Text style={styles.scholarshipOptionDetails}>Requirements: {scholarship.requirements}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, 
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
            
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('reportCard')}
            >
              <Text style={styles.documentButtonText}>
                {formData.documents.reportCard ? formData.documents.reportCard.name : 'Upload Report Card'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('brgyClearance')}
            >
              <Text style={styles.documentButtonText}>
                {formData.documents.brgyClearance ? formData.documents.brgyClearance.name : 'Upload Barangay Clearance'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('incomeCertificate')}
            >
              <Text style={styles.documentButtonText}>
                {formData.documents.incomeCertificate ? formData.documents.incomeCertificate.name : 'Upload Income Certificate'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]}
                onPress={() => setCurrentStep(5)}
              >
                <Text style={styles.buttonText}>Next: Set Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Appointment
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Set Interview Appointment</Text>
            
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {formData.appointment.date.toDateString()}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Preferred Time (e.g. 10:00 AM)"
              value={formData.appointment.time}
              onChangeText={(text) => handleInputChange('appointment', 'time', text)}
              placeholderTextColor="#aaa"
            />
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]}
                onPress={() => setCurrentStep(4)}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={() => {
                  // Submit the application
                  alert('Application submitted successfully!');
                  setCurrentStep(0);
                  setActiveTab('available');
                  setSelectedScholarship(null);
                  // Reset form
                  setFormData({
                    scholarshipId: null,
                    personalInfo: {
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                    },
                    residency: {
                      address: '',
                      city: '',
                      yearsResiding: '',
                    },
                    familyBackground: {
                      parentsStatus: '',
                      siblings: '',
                      householdIncome: '',
                    },
                    documents: {
                      reportCard: null,
                      brgyClearance: null,
                      incomeCertificate: null,
                    },
                    appointment: {
                      date: new Date(),
                      time: '',
                    }
                  });
                }}
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
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
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
            {availableScholarships.map(scholarship => (
              <View key={scholarship.id} style={styles.scholarshipCard}>
                <Text style={styles.scholarshipName}>{scholarship.name}</Text>
                <Text style={styles.scholarshipDeadline}>Deadline: {scholarship.deadline}</Text>
                <Text style={styles.scholarshipRequirements}>Requirements: {scholarship.requirements}</Text>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => {
                    setActiveTab('apply');
                    setSelectedScholarship(scholarship);
                    setFormData(prev => ({
                      ...prev,
                      scholarshipId: scholarship.id
                    }));
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            ))}
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
  },
  scholarshipName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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
  applyButtonText: {
    color: 'white',
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
  documentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  documentButtonText: {
    color: 'white',
  },
  datePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  datePickerText: {
    color: 'white',
    textAlign: 'center',
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
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // New styles for scholarship selection
  scholarshipOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedScholarship: {
    backgroundColor: 'rgba(255, 160, 0, 0.2)',
    borderColor: '#FFA000',
  },
  scholarshipOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scholarshipOptionDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedScholarshipText: {
    color: '#FFA000',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});