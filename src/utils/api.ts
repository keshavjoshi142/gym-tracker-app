import Constants from 'expo-constants';

// Get API URL from environment variables
const getApiUrl = () => {
  console.log('🔍 Determining API URL...');
    
  // Then try Expo public environment variable (build-time only)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('✅ Using API URL from process.env:', process.env.EXPO_PUBLIC_API_URL);
    return `${process.env.EXPO_PUBLIC_API_URL}/api`;
  }
  
  console.log('⚠️ No API URL found in Constants or environment variables, using localhost fallback');
  // Fallback to localhost for development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiUrl();

// Debug: Log the API URL being used
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment from Constants:', Constants.expoConfig?.extra?.environment);
console.log('🔧 Environment from process.env:', process.env.EXPO_PUBLIC_ENVIRONMENT);
console.log('📡 API URL from Constants:', Constants.expoConfig?.extra?.apiUrl);
console.log('📡 API URL from process.env:', process.env.EXPO_PUBLIC_API_URL);
console.log('⚙️ All Constants Extra:', Constants.expoConfig?.extra);

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  static async request(endpoint: string, options: ApiOptions = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`API Response: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  // Exercise endpoints
  static async getExercises(): Promise<any> {
    return this.request('/exercises');
  }

  static async createExercise(exercise: any): Promise<any> {
    return this.request('/exercises', {
      method: 'POST',
      body: exercise,
    });
  }

  // Workout endpoints
  static async getWorkouts(): Promise<any> {
    return this.request('/workouts');
  }

  static async createWorkout(workout: any): Promise<any> {
    return this.request('/workouts', {
      method: 'POST',
      body: workout,
    });
  }

  static async updateWorkout(id: string, workout: any): Promise<any> {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: workout,
    });
  }

  static async deleteWorkout(id: string): Promise<any> {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  // Progress endpoints
  static async getPersonalRecords(): Promise<any> {
    return this.request('/progress/personal-records');
  }

  static async getExerciseProgress(exerciseId: string): Promise<any> {
    return this.request(`/progress/exercise/${exerciseId}`);
  }
}

export default ApiService;