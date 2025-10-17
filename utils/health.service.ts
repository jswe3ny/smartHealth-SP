import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthKitPermissions,
} from 'react-native-health';
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export interface HealthData {
  steps: number;
  distance: number; // in miles
  calories: number;
  weight: number | null; // in lbs
  activeMinutes: number;
  lastUpdated: Date;
}

class HealthService {
  private isInitialized = false;
  private useMockData = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_HEALTH === 'true';

  async initialize(): Promise<boolean> {
    try {
      if (this.useMockData) {
        console.log('Using mock health data for development');
        this.isInitialized = true;
        return true;
      }

      if (Platform.OS === 'android') {
        return await this.initializeAndroid();
      } else if (Platform.OS === 'ios') {
        return await this.initializeIOS();
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize health service:', error);
      return false;
    }
  }

  private async initializeAndroid(): Promise<boolean> {
    try {
      const status = await getSdkStatus();
      
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        console.log('Health Connect is not available');
        return false;
      }

      const isInitialized = await initialize();
      
      if (isInitialized) {
        const permissions = [
          { accessType: 'read' as const, recordType: 'Steps' as const },
          { accessType: 'read' as const, recordType: 'Distance' as const },
          { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
          { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
          { accessType: 'read' as const, recordType: 'Weight' as const },
        ];

        await requestPermission(permissions);
        this.isInitialized = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Android Health Connect initialization failed:', error);
      return false;
    }
  }

  private async initializeIOS(): Promise<boolean> {
    return new Promise((resolve) => {
      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Weight,
          ],
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('iOS HealthKit initialization failed:', error);
          resolve(false);
        } else {
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  async getTodayData(): Promise<HealthData | null> {
    if (this.useMockData) {
      return this.getMockData();
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    if (Platform.OS === 'android') {
      return await this.getAndroidData();
    } else if (Platform.OS === 'ios') {
      return await this.getIOSData();
    }

    return null;
  }

  private getMockData(): HealthData {
    const baseSteps = 7500;
    const variance = Math.random() * 2000 - 1000;
    
    return {
      steps: Math.round(baseSteps + variance),
      distance: ((baseSteps + variance) * 0.7) / 1609.34,
      calories: Math.round((baseSteps + variance) * 0.04),
      weight: 165 + Math.random() * 4 - 2,
      activeMinutes: Math.round(30 + Math.random() * 30),
      lastUpdated: new Date(),
    };
  }

  private async getAndroidData(): Promise<HealthData | null> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      };

      const stepsResult = await readRecords('Steps', { timeRangeFilter });
      const steps = stepsResult.records.reduce((sum, record) => sum + (record.count || 0), 0);

      const distanceResult = await readRecords('Distance', { timeRangeFilter });
      const distance = distanceResult.records.reduce(
        (sum, record) => sum + (record.distance?.inMeters || 0),
        0
      );

      const calorieResult = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter,
      });
      const calories = calorieResult.records.reduce(
        (sum, record) => sum + (record.energy?.inKilocalories || 0),
        0
      );

      const weightResult = await readRecords('Weight', { timeRangeFilter });
      let weight = null;
      if (weightResult.records.length > 0) {
        const latestWeight = weightResult.records[weightResult.records.length - 1];
        const weightInKg = latestWeight.weight?.inKilograms || null;
        weight = weightInKg ? weightInKg * 2.20462 : null;
      }

      return {
        steps: Math.round(steps),
        distance: Math.round(distance),
        calories: Math.round(calories),
        weight,
        activeMinutes: 0,
        lastUpdated: now,
      };
    } catch (error) {
      console.error('Failed to fetch Android health data:', error);
      return null;
    }
  }

  private async getIOSData(): Promise<HealthData | null> {
    return new Promise((resolve) => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: now.toISOString(),
      };

      const healthData: Partial<HealthData> = {
        steps: 0,
        distance: 0,
        calories: 0,
        weight: null,
        activeMinutes: 0,
        lastUpdated: now,
      };

      let completedRequests = 0;
      const totalRequests = 4;

      const checkComplete = () => {
        completedRequests++;
        if (completedRequests === totalRequests) {
          resolve(healthData as HealthData);
        }
      };

      AppleHealthKit.getStepCount(options, (err, results: any) => {
        if (!err && results && typeof results.value === 'number') {
          healthData.steps = Math.round(results.value);
        }
        checkComplete();
      });

      AppleHealthKit.getDistanceWalkingRunning(options, (err, results: any) => {
        if (!err && results && typeof results.value === 'number') {
          healthData.distance = Math.round(results.value * 1000);
        }
        checkComplete();
      });

      AppleHealthKit.getActiveEnergyBurned(options, (err, results: any) => {
        if (!err && results && typeof results.value === 'number') {
          healthData.calories = Math.round(results.value);
        }
        checkComplete();
      });

      AppleHealthKit.getLatestWeight({}, (err, results: any) => {
        if (!err && results && typeof results.value === 'number') {
          healthData.weight = results.value * 2.20462;
        }
        checkComplete();
      });
    });
  }

  async isAvailable(): Promise<boolean> {
    if (this.useMockData) {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const status = await getSdkStatus();
        return status === SdkAvailabilityStatus.SDK_AVAILABLE;
      } catch {
        return false;
      }
    } else if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        AppleHealthKit.isAvailable((error, available) => {
          if (error) {
            resolve(false);
          } else {
            resolve(available);
          }
        });
      });
    }
    return false;
  }
}

export const healthService = new HealthService();