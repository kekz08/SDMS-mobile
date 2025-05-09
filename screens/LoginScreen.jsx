import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.254.101:3000/api';

export default function LoginScreen({ onLogin, onLogout }) {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = !!onLogout;

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== Login Process Started ===');
      console.log('Making login request to:', `${API_URL}/login`);
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const responseText = await response.text();
      console.log('Raw server response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse server response:', error);
        throw new Error('Invalid server response');
      }

      console.log('Parsed server response:', {
        token: data.token ? '[HIDDEN]' : undefined,
        user: data.user ? {
          ...data.user,
          role: data.user.role,
          contactNumber: `'${data.user.contactNumber}'`,
          address: `'${data.user.address}'`
        } : undefined
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the token and user data
      console.log('=== Storing User Data ===');
      console.log('Data to be stored:', {
        ...data.user,
        role: data.user.role,
        contactNumber: `'${data.user.contactNumber}'`,
        address: `'${data.user.address}'`
      });

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      // Verify what was stored
      console.log('=== Verifying Stored Data ===');
      const storedData = await AsyncStorage.getItem('userData');
      const parsedStoredData = JSON.parse(storedData);
      console.log('Data retrieved from storage:', {
        ...parsedStoredData,
        role: parsedStoredData.role,
        contactNumber: `'${parsedStoredData.contactNumber}'`,
        address: `'${parsedStoredData.address}'`
      });

      // Call onLogin and navigate based on role
      if (onLogin) {
        onLogin();
      }
      
      // Ensure role-based navigation
      const targetRoute = data.user.role === 'admin' ? 'AdminDashboard' : 'Dashboard';
      console.log('=== Navigation Decision ===');
      console.log('User role:', data.user.role);
      console.log('Target route:', targetRoute);

      // Force a slight delay to ensure AsyncStorage is updated
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: targetRoute }],
        });
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
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

          <View style={styles.content}>
            <Image 
              source={require('../assets/login-illustration.png')} 
              style={styles.illustration} 
              resizeMode="contain"
            />
            
            <Text style={styles.heading}>
              {isLoggedIn ? 'Ready to leave?' : 'Welcome to SDMS'}
            </Text>
            <Text style={styles.subheading}>
              {isLoggedIn ? 'We hope to see you again soon!' : 'Sign in to access your scholarship portal'}
            </Text>

            {!isLoggedIn && (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Username or Email"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.actionButton,
                isLoading && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient 
                colors={isLoggedIn ? ['#FF5252', '#FF1744'] : ['#FFD700', '#FFC107']} 
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Ionicons name="reload-outline" size={24} color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLoggedIn ? 'Logout' : 'Login'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {!isLoggedIn && (
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#008000' },
  gradient: { ...StyleSheet.absoluteFillObject },
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
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginRight: 8 },
  logo: { width: 40, height: 40 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  illustration: {
    width: 200,
    height: 150,
    marginBottom: 30,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    paddingVertical: 15,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FFA000',
    fontSize: 14,
  },
  actionButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 5,
  },
  signupLink: {
    color: '#FFA000',
    fontWeight: 'bold',
  },
});