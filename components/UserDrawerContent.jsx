import { View, Text, Image, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function UserDrawerContent({ navigation, onLogout }) {
  return (
    <DrawerContentScrollView 
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/haidee.jpg')} 
          style={styles.profileImage} 
        />
        <Text style={styles.name}>Haidee G. Lisondra</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#00cc66" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      {/* Drawer Items */}
      <View style={styles.menuContainer}>
        <DrawerItem
          label="Dashboard"
          icon={({ color, size }) => <MaterialIcons name="dashboard" color={color} size={size} />}
          onPress={() => navigation.navigate('Dashboard')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        
        <DrawerItem
          label="Educational Aids"
          icon={({ color, size }) => <FontAwesome5 name="book" color={color} size={size} />}
          onPress={() => navigation.navigate('Educational Aids')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        <DrawerItem
          label="Application Status"
          icon={({ color, size }) => <FontAwesome5 name="star" color={color} size={size} />}
          onPress={() => navigation.navigate('Application Status')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        <DrawerItem
          label="Announcements"
          icon={({ color, size }) => <FontAwesome5 name="bullhorn" color={color} size={size} />}
          onPress={() => navigation.navigate('Announcements')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        <DrawerItem
          label="Concerns"
          icon={({ color, size }) => <FontAwesome5 name="info-circle" color={color} size={size} />}
          onPress={() => navigation.navigate('Concerns')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        <DrawerItem
          label="Profile"
          icon={({ color, size }) => <FontAwesome5 name="user" color={color} size={size} />}
          onPress={() => navigation.navigate('Profile')}
          labelStyle={styles.label}
          activeTintColor="#004d00"
          activeBackgroundColor="#e6ffe6"
        />
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <FontAwesome5 name="sign-out-alt" color="#ff3333" size={size} />}
          onPress={onLogout} // Call the logout function passed as a prop
          labelStyle={[styles.label, { color: '#ff3333' }]}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e6ffe6'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004d00',
    marginBottom: 5
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6ffe6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10
  },
  verifiedText: {
    fontSize: 12,
    color: '#004d00',
    marginLeft: 5
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
});
