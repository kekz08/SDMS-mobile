import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConcernScreen() {
  const navigation = useNavigation();
  const [concern, setConcern] = useState('');
  const [submittedConcerns, setSubmittedConcerns] = useState([
    {
      id: 1,
      date: 'April 10, 2025',
      message: 'I need an update on my scholarship application status',
      status: 'Resolved'
    },
    {
      id: 2,
      date: 'April 15, 2025',
      message: 'Document upload issue',
      status: 'In Progress'
    }
  ]);

  const handleSubmit = () => {
    if (concern.trim()) {
      const newConcern = {
        id: submittedConcerns.length + 1,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        message: concern,
        status: 'Pending'
      };
      setSubmittedConcerns([newConcern, ...submittedConcerns]);
      setConcern('');
      // Here you would typically send the concern to your backend
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#4CAF50';
      case 'In Progress': return '#FFC107';
      case 'Pending': return '#2196F3';
      default: return '#9E9E9E';
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
            <TouchableOpacity onPress={() => {/* navigate to notifications */}}>
              <Ionicons name="notifications" size={26} color="white" style={styles.notificationIcon} />
            </TouchableOpacity>
            <Image
              source={require('../assets/haidee.jpg')}
              style={styles.profileImage}
            />
          </View>
        </View>

        <Text style={styles.heading}>Raise a Concern</Text>
        <Text style={styles.description}>
          Contact support or submit issues about your application
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Describe your concern</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Type your concern here..."
            placeholderTextColor="#aaa"
            value={concern}
            onChangeText={setConcern}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Concern</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.concernsContainer}>
          <Text style={styles.sectionTitle}>Your Submitted Concerns</Text>
          
          {submittedConcerns.length > 0 ? (
            submittedConcerns.map((item) => (
              <View key={item.id} style={styles.concernCard}>
                <View style={styles.concernHeader}>
                  <Text style={styles.concernDate}>{item.date}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.concernMessage}>{item.message}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noConcernsText}>No concerns submitted yet</Text>
          )}
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
  
  notificationIcon: {
    marginRight: 10,
  },

  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },

  concernCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  concernDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },

  concernMessage: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },

  noConcernsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});