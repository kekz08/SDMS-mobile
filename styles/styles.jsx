import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#008000', alignItems: 'center' },
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
  backButton: { padding: 10, marginRight: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  logo: { width: 40, height: 40, resizeMode: 'contain' },

  heading: { fontSize: 22, fontWeight: 'bold', color: 'white', marginTop: 30, textAlign: 'center' },
  description: { fontSize: 16, color: 'white', textAlign: 'center', width: '80%', marginTop: 10 },
});
