// Check if in development mode - React Native compatible
const isDev = process.env.NODE_ENV === 'development';

const API_BASE_URL = isDev
  ? 'http://localhost:3000/api' 
  : 'https://your-production-server.com/api';

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