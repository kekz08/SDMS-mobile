import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, BASE_URL } from '../config';

export default function UserManagementScreen({ navigation, route }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' or 'pending'

  // Set initial filter type from route params
  useEffect(() => {
    if (route.params?.initialFilter) {
      setFilterType(route.params.initialFilter);
    }
  }, [route.params?.initialFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user => {
        const matchesSearch = 
          user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const isReallyVerified = user.role === 'admin' || user.isVerified === true || user.isVerified === 1 || user.isVerified === '1';

        const matchesFilter = 
          filterType === 'all' || (filterType === 'pending' && !isReallyVerified);

        return matchesSearch && matchesFilter;
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users, filterType]); // Add filterType dependency

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching users with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch users');
      }

      const data = await response.json();
      console.log('Fetched users:', data);
      
      // Filter out any invalid user data
      const validUsers = data.filter(user => 
        user && user.id && (user.firstName || user.lastName || user.email)
      );

      setUsers(validUsers);
      // Initial filtering will be handled by the useEffect reacting to users and filterType
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      Alert.alert(
        'Error',
        `Failed to load users: ${error.message}`,
        [
          { 
            text: 'Retry', 
            onPress: () => fetchUsers() 
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    if (action === 'edit') {
      setModalVisible(true);
    } else if (action === 'delete') {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => deleteUser(user.id)
          }
        ]
      );
    } else if (action === 'verify') {
      Alert.alert(
        'Verify User',
        `Are you sure you want to verify ${user.firstName} ${user.lastName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Verify', 
            onPress: () => verifyUser(user.id)
          }
        ]
      );
    }
  };

  const verifyUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending verify request for user:', userId);
      const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify user');
      }

      if (!data.success) {
        throw new Error(data.message || 'Verification failed');
      }

      // Update the users list with the verified status
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, isVerified: true } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      
      Alert.alert(
        'Success',
        data.message || 'User verified successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error verifying user:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to verify user',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
      Alert.alert('Success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', `Failed to delete user: ${error.message}`);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update user role');
      }

      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setModalVisible(false);
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', `Failed to update user role: ${error.message}`);
    }
  };

  const renderUserCard = ({ item }) => {
    const isReallyVerified = item.role === 'admin' || item.isVerified === true || item.isVerified === 1 || item.isVerified === '1';
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.studentId && (
            <Text style={styles.studentId}>ID: {item.studentId}</Text>
          )}
          <View style={styles.badgeRow}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: item.role === 'admin' ? '#e3f6e8' : '#e3ecfa', borderColor: item.role === 'admin' ? '#43a047' : '#1976d2' }
            ]}>
              <Ionicons name={item.role === 'admin' ? "shield-checkmark" : "person"} size={15} color={item.role === 'admin' ? '#43a047' : '#1976d2'} />
              <Text style={[styles.badgeText, { color: item.role === 'admin' ? '#388e3c' : '#1976d2' }]}>{item.role.toUpperCase()}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isReallyVerified ? '#e3f6e8' : '#fff7e3', borderColor: isReallyVerified ? '#43a047' : '#ffa000' }
            ]}>
              <Ionicons name={isReallyVerified ? "checkmark-circle" : "time"} size={15} color={isReallyVerified ? '#43a047' : '#ffa000'} />
              <Text style={[styles.badgeText, { color: isReallyVerified ? '#388e3c' : '#ffa000' }]}>{isReallyVerified ? 'Verified' : 'Pending'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.actionButtons}>
          {!isReallyVerified && item.role !== 'admin' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#e3f6e8', borderColor: '#43a047' }]}
              onPress={() => handleUserAction(item, 'verify')}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#43a047" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#e3ecfa', borderColor: '#1976d2' }]}
            onPress={() => handleUserAction(item, 'edit')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#fae3e3', borderColor: '#e53935' }]}
            onPress={() => handleUserAction(item, 'delete')}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={22} color="#e53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#005500', '#007000', '#009000']} style={styles.gradient} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={fetchUsers} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or ID..."
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterButtonText]}>All Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'pending' && styles.activeFilterButton]}
          onPress={() => setFilterType('pending')}
        >
          <Text style={[styles.filterButtonText, filterType === 'pending' && styles.activeFilterButtonText]}>Pending Verifications</Text>
        </TouchableOpacity>
      </View>

      {/* User Count */}
      {!loading && filteredUsers.length > 0 && (
        <Text style={styles.userCountText}>
          Showing {filteredUsers.length} {filterType === 'pending' ? 'pending' : 'total'} {filteredUsers.length === 1 ? 'user' : 'users'}
        </Text>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="white" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={50} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.noDataText}>
            {searchQuery ? 'No users match your search' : filterType === 'pending' ? 'No pending users found' : 'No users found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchUsers}
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
            <Text style={styles.modalTitle}>Update User Role</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="New Role"
              value={selectedUser?.role}
              onChangeText={(text) => setSelectedUser(prevUser => ({ ...prevUser, role: text }))}
            />
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => updateUserRole(selectedUser.id, selectedUser.role)}
            >
              <Text style={styles.updateButtonText}>Update Role</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005500',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  refreshButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 5,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeFilterButtonText: {
    color: '#008000',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f2f2f2',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 2 },
  userEmail: { fontSize: 14, color: '#888', marginBottom: 1 },
  studentId: { fontSize: 13, color: '#bbb', fontStyle: 'italic', marginBottom: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    borderWidth: 1.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.5,
  },
  badgeText: { fontWeight: 'bold', fontSize: 13, marginLeft: 5 },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#f2f2f2',
    marginHorizontal: 18,
    borderRadius: 1,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  updateButton: {
    backgroundColor: '#008000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  listContainer: {
    padding: 18,
    paddingTop: 0,
  },
  userCountText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});