import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commonStyles } from '../styles/styles';

export default function LoginScreen({ onLogin, onLogout }) {
  const navigation = useNavigation();

  const handleLogin = () => {
    if (onLogin) {
      onLogin(); // Triggers drawer switch
    } else {
      navigation.navigate('Dashboard');
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout(); // Switch back to Guest
    } else {
      navigation.goBack();
    }
  };

  const isLoggedIn = !!onLogout; // Just a trick to show correct button

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      <Image source={require('../assets/logo.png')} style={styles.bgLogo} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>{isLoggedIn ? 'Logout' : 'Login'}</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
      </View>

      <Text style={styles.heading}>{isLoggedIn ? 'See you again!' : 'Welcome Back!'}</Text>

      {!isLoggedIn && (
        <View style={styles.inputContainer}>
          <TextInput placeholder="Username" placeholderTextColor="white" style={styles.input} />
          <TextInput placeholder="Password" placeholderTextColor="white" secureTextEntry style={styles.input} />
        </View>
      )}

      <TouchableOpacity style={styles.loginButton} onPress={isLoggedIn ? handleLogout : handleLogin}>
        <LinearGradient colors={['#FFD700', '#FFC107']} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>{isLoggedIn ? 'Logout' : 'Login'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  inputContainer: { width: '80%', marginTop: 20 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  loginButton: { marginTop: 20, borderRadius: 8, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});
