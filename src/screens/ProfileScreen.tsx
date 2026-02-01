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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ] 
    );
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
            onPress={handleLogout}
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6750A4',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
  },
  menuCard: {
    marginBottom: 16,
    elevation: 2,
  },
  menuTitle: {
    fontSize: 18,
    marginBottom: 8,
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