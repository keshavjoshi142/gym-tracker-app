import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Avatar,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '@/contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    console.log('🔘 Logout button clicked');
    
    // Skip confirmation for now to test direct logout
    console.log('📱 Proceeding with direct logout...');
    try {
      console.log('🚪 Calling logout function...');
      await logout();
      console.log('✅ Logout function completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Try to use window.confirm as fallback for web
      if (typeof window !== 'undefined' && window.confirm) {
        window.alert('Failed to logout. Please try again.');
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={80}
                label={user.username.substring(0, 2).toUpperCase()}
                style={styles.avatar}
              />
              <Title style={styles.username}>{user.username}</Title>
              {user.email && (
                <Paragraph style={styles.email}>{user.email}</Paragraph>
              )}
              <Paragraph style={styles.memberSince}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.menuCard}>
          <Card.Content>
            <Title style={styles.menuTitle}>Account</Title>
            
            <List.Item
              title="Edit Profile"
              description="Update your profile information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to edit profile screen
                Alert.alert('Coming Soon', 'Profile editing will be available in the next update');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Settings"
              description="App preferences and settings"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // TODO: Navigate to settings screen
                Alert.alert('Coming Soon', 'Settings will be available in the next update');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert('Help & Support', 'For support, please contact us at support@gymtracker.com');
              }}
            />
          </Card.Content>
        </Card>

        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              console.log('🔘 Logout button onPress triggered');
              handleLogout();
            }}
            style={styles.logoutButton}
            textColor="#ff5252"
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#1E1E1E',
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#BB86FC',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  email: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 12,
    color: '#888888',
  },
  menuCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#1E1E1E',
  },
  menuTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: '#ff5252',
  },
});

export default ProfileScreen;