import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.drawerContent}>
        <TouchableOpacity style={styles.logoContainer}>
          <FontAwesome5 name="graduation-cap" size={40} color="#004d00" />
        </TouchableOpacity>

        <DrawerItem
          label="Home"
          icon={({ color, size }) => <FontAwesome5 name="home" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('Home')}
        />
        <DrawerItem
          label="Scholarship"
          icon={({ color, size }) => <FontAwesome5 name="book" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('Scholarship')}
        />
        <DrawerItem
          label="Features"
          icon={({ color, size }) => <FontAwesome5 name="star" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('Features')}
        />
        <DrawerItem
          label="Testimonials"
          icon={({ color, size }) => <FontAwesome5 name="comments" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('Testimonials')}
        />
        <DrawerItem
          label="About"
          icon={({ color, size }) => <FontAwesome5 name="info-circle" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('About')}
        />
        <DrawerItem
          label="Login"
          icon={({ color, size }) => <FontAwesome5 name="sign-in-alt" color={color} size={size} />}
          labelStyle={styles.labelStyle}
          onPress={() => props.navigation.navigate('Login')}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#fff' },
  drawerContent: { paddingVertical: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  labelStyle: { fontSize: 16, fontWeight: '500', color: '#004d00' },
});
