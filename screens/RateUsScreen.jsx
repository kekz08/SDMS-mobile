import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

export default function RateUsScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userData, setUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const initializeScreen = async () => {
      await loadUserData();
      await fetchUserRating();
      setInitialLoadComplete(true);
    };
    initializeScreen();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  const fetchUserRating = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        console.log('No user token or data found, cannot fetch existing rating.');
        return;
      }

      const userData = JSON.parse(userDataString);

      if (!userData || !userData.id) {
          console.log('User data not fully loaded, skipping fetchUserRating.');
          return;
      }

      console.log('Attempting to fetch user rating for userId:', userData.id);
      const response = await fetch(`${BASE_URL}/api/ratings/user/${userData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Fetch user rating response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Existing rating data received:', data);
        if (data) {
          setRating(data.rating);
          setComment(data.comment || '');
          setExistingRatingId(data.id);
        }
      } else if (response.status === 404) {
          console.log('No existing rating found for this user (404).');
      } else {
        const errorData = await response.text();
        console.error('Error fetching existing rating:', response.status, errorData);
      }
    } catch (error) {
      console.error('Network or parsing error fetching existing rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!token || !userDataString) {
        Alert.alert('Error', 'Please log in to submit/update a rating');
        return;
      }

      const userData = JSON.parse(userDataString);
      const method = existingRatingId ? 'PUT' : 'POST';
      const url = existingRatingId ? `${BASE_URL}/api/ratings/${existingRatingId}` : `${BASE_URL}/api/ratings`;

      console.log(`Submitting rating via ${method} to ${url}`);
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating,
          comment: comment,
          userId: userData.id,
          userName: `${userData.firstName} ${userData.lastName}`,
          userRole: userData.role || 'Student',
        }),
      });

      const data = await response.json();
      console.log('Submit/Update rating response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${method === 'PUT' ? 'update' : 'submit'} rating`);
      }

      Alert.alert(
        'Success',
        existingRatingId ? 'Your rating has been updated!' : 'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(`Error ${existingRatingId ? 'updating' : 'submitting'} rating:`, error);
      Alert.alert(
        'Error',
        error.message || `Failed to ${existingRatingId ? 'update' : 'submit'} rating. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFD700' : '#FFFFFF'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!initialLoadComplete) {
      return (
          <View style={[styles.container, styles.centerContent]}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading rating info...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#005500', '#007000', '#009000']}
        style={styles.gradient}
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

      <ScrollView style={styles.content}>
        <View style={styles.ratingContainer}>
          <Text style={styles.heading}>{existingRatingId ? 'Edit Your Rating' : 'Rate Your Experience'}</Text>
          <Text style={styles.subheading}>{existingRatingId ? 'Update your feedback below.' : 'How was your experience with SDMS?'}</Text>
          
          {renderStars()}
          
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts (optional)"
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity 
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? (existingRatingId ? 'Updating...' : 'Submitting...') : (existingRatingId ? 'Update Rating' : 'Submit Rating')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ratingContainer: {
    backgroundColor: 'rgba(0, 77, 0, 0.8)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starButton: {
    padding: 5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    width: '100%',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#005500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
}); 