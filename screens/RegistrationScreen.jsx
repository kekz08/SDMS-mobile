import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.254.101:3000/api';

export default function RegistrationScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    college: '',
    course: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    console.log('Validating form...');
    
    // Check required fields
    const requiredFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      studentId: 'Student ID',
      college: 'College',
      course: 'Course'
    };

    const missingFields = [];
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]) {
        missingFields.push(label);
      }
    });

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      Alert.alert(
        'Required Fields Missing',
        `Please fill in the following fields:\n${missingFields.join('\n')}`
      );
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('Invalid email format');
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      console.log('Password too short');
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return false;
    }

    console.log('Form validation passed');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Starting registration process...');
      console.log('Form data:', {
        ...formData,
        password: '[HIDDEN]',
        confirmPassword: '[HIDDEN]'
      });

      // Prepare data with proper null handling
      const sanitizedData = {
        firstName: String(formData.firstName || '').trim(),
        lastName: String(formData.lastName || '').trim(),
        email: String(formData.email || '').trim().toLowerCase(),
        password: formData.password,
        contactNumber: String(formData.contactNumber || '').trim(),
        studentId: String(formData.studentId || '').trim(),
        college: String(formData.college || '').trim(),
        course: String(formData.course || '').trim(),
        address: formData.address ? String(formData.address).trim() : null
      };

      // Remove empty strings
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === '') {
          sanitizedData[key] = null;
        }
      });

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'password', 'studentId', 'college', 'course'];
      const missingFields = requiredFields.filter(field => !sanitizedData[field]);
      
      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Required Fields',
          `Please fill in the following fields:\n${missingFields.join('\n')}`
        );
        return;
      }

      // Log the exact request for debugging
      console.log('Full request details:', {
        url: `${API_URL}/register`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: { ...sanitizedData, password: '[HIDDEN]' }
      });

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(sanitizedData),
        });

        // Get the raw response text first
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response:', data);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid server response format');
        }

        if (!response.ok) {
          // Log the full error details
          console.error('Error details:', {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          throw new Error(data.error || data.message || 'Registration failed');
        }

        // Clear form data on success
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          contactNumber: '',
          password: '',
          confirmPassword: '',
          studentId: '',
          college: '',
          course: '',
          address: ''
        });

        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully. Please login with your credentials.',
          [{ text: 'Proceed to Login', onPress: () => navigation.navigate('Login') }]
        );

      } catch (error) {
        console.error('Full error details:', error);
        Alert.alert(
          'Registration Failed',
          error.message || 'Failed to create account. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
        <View style={styles.logoContainer}>
          <Text style={styles.title}>SDMS</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Scholar Registration</Text>
          
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(text) => handleInputChange('firstName', text)}
            placeholderTextColor="#aaa"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(text) => handleInputChange('lastName', text)}
            placeholderTextColor="#aaa"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            placeholderTextColor="#aaa"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.contactNumber}
            onChangeText={(text) => handleInputChange('contactNumber', text)}
            keyboardType="phone-pad"
            placeholderTextColor="#aaa"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
            placeholderTextColor="#aaa"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            secureTextEntry
            placeholderTextColor="#aaa"
          />

          <TextInput
            style={styles.input}
            placeholder="Student ID"
            value={formData.studentId}
            onChangeText={(text) => handleInputChange('studentId', text)}
            placeholderTextColor="#aaa"
          />

          <TextInput
            style={styles.input}
            placeholder="College"
            value={formData.college}
            onChangeText={(text) => handleInputChange('college', text)}
            placeholderTextColor="#aaa"
          />

          <TextInput
            style={styles.input}
            placeholder="Course"
            value={formData.course}
            onChangeText={(text) => handleInputChange('course', text)}
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login here</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 15,
    color: 'white',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  registerButton: {
    backgroundColor: '#FFA000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 5,
  },
  loginLink: {
    color: '#FFA000',
    fontWeight: 'bold',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginRight: 8 },
  logo: { width: 40, height: 40 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
});