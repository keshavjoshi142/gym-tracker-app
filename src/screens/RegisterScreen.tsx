import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Button,
  TextInput,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AuthStackParamList } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const validateForm = () => {
    console.log('🤔 validateForm called with:', {
      username: `'${username.trim()}'`,
      usernameLength: username.trim().length,
      password: `'${password}'`,
      passwordLength: password.length,
      confirmPassword: `'${confirmPassword}'`,
      email: `'${email.trim()}'`
    });
    
    if (!username.trim()) {
      console.log('❌ Validation failed: Username is required');
      Alert.alert('Error', 'Username is required');
      return false;
    }

    if (username.trim().length < 3) {
      console.log('❌ Validation failed: Username too short');
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }

    if (!password.trim()) {
      console.log('❌ Validation failed: Password is required');
      Alert.alert('Error', 'Password is required');
      return false;
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      console.log('❌ Validation failed: Invalid email format');
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    console.log('✅ Form validation passed');
    return true;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    console.log('🔥 handleRegister called - button press detected');
    console.log('📝 Form values:', { 
      username: `'${username}'`, 
      usernameLength: username.length,
      usernameTrimmed: `'${username.trim()}'`, 
      usernameTrimmedLength: username.trim().length,
      password: `'${password}'`,
      passwordLength: password.length,
      passwordTrimmed: `'${password.trim()}'`,
      passwordTrimmedLength: password.trim().length,
      email: `'${email}'`,
      formLoading,
      authLoading: loading
    });
    
    console.log('🤔 Checking form validation...');
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('📱 Form validated, proceeding with registration for:', username);
    setFormLoading(true);
    try {
      console.log('🚀 Calling register function...');
      const success = await register(username.trim(), password, email.trim() || undefined);
      console.log('📨 Register result:', success);
      
      if (!success) {
        Alert.alert('Error', 'Username already exists. Please choose a different username.');
      } else {
        console.log('✅ Registration successful!');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Icon name="fitness-center" size={48} color="#BB86FC" />
            <Title style={styles.title}>Create Account</Title>
            <Paragraph style={styles.subtitle}>
              Join GymTracker and start your fitness journey
            </Paragraph>
          </View>

          <Card style={styles.registerCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.form}>
                <TextInput
                  mode="outlined"
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={formLoading}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  mode="outlined"
                  label="Email (Optional)"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  disabled={formLoading}
                  left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  disabled={formLoading}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  disabled={formLoading}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
                
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('🔘 Button onPress triggered');
                    console.log('🔘 Current state:', { username: username.trim(), password: password.trim(), formLoading, authLoading: loading });
                    handleRegister();
                  }}
                  style={styles.registerButton}
                  loading={formLoading}
                  disabled={formLoading || !username.trim() || !password.trim()}
                >
                  Create Account
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Paragraph style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.linkText} onPress={goToLogin}>
                Sign In
              </Text>
            </Paragraph>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B0B0B0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#BB86FC',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  registerCard: {
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
  },
  cardContent: {
    padding: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#2D2D2D',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#BB86FC',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  linkText: {
    color: '#BB86FC',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;