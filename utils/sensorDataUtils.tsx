// 센서 데이터 정리 및 관리 유틸리티

// 센서 데이터 통계
export const getSensorDataStats = () => {
  try {
    const existingData = localStorage.getItem('mock_sensors') || '[]';
    const sensorsArray = JSON.parse(existingData);
    
    if (Array.isArray(sensorsArray)) {
      const sensorIds = new Set(sensorsArray.map((sensor: any) => sensor.sensorId));
      const stats = {
        totalRecords: sensorsArray.length,
        uniqueSensors: sensorIds.size,
        sensorIds: Array.from(sensorIds)
      };
      
      console.log('📊 [UTIL] Sensor data stats:', stats);
      return stats;
    }
    
    const emptyStats = { totalRecords: 0, uniqueSensors: 0, sensorIds: [] };
    console.log('📊 [UTIL] Sensor data stats (empty):', emptyStats);
    return emptyStats;
  } catch (error) {
    console.error('❌ [UTIL] Failed to get sensor data stats:', error);
    return { totalRecords: 0, uniqueSensors: 0, sensorIds: [] };
  }
};

// 모든 센서 데이터 정리
export const clearAllSensorData = () => {
  try {
    // 로컬 스토리지에서 센서 데이터 제거
    localStorage.removeItem('mock_sensors');
    console.log('✅ [UTIL] All sensor data cleared from localStorage');
    
    // 현재 통계도 로그 출력
    const stats = getSensorDataStats();
    console.log('📊 [UTIL] Current sensor data stats after clear:', stats);
  } catch (error) {
    console.error('❌ [UTIL] Failed to clear sensor data:', error);
  }
};

// 특정 센서 데이터만 제거
export const clearSensorData = (sensorId: string) => {
  try {
    const existingData = localStorage.getItem('mock_sensors') || '[]';
    let sensorsArray = JSON.parse(existingData);
    
    if (Array.isArray(sensorsArray)) {
      const beforeCount = sensorsArray.length;
      const filteredData = sensorsArray.filter((sensor: any) => sensor.sensorId !== sensorId);
      const afterCount = filteredData.length;
      
      localStorage.setItem('mock_sensors', JSON.stringify(filteredData));
      console.log(`✅ [UTIL] Sensor data for ${sensorId} cleared (${beforeCount} -> ${afterCount} records)`);
    }
  } catch (error) {
    console.error(`❌ [UTIL] Failed to clear sensor data for ${sensorId}:`, error);
  }
};

// 시스템 시작 시 센서 데이터 정리
export const initializeSensorData = () => {
  console.log('🔄 [UTIL] Initializing sensor data...');
  const currentStats = getSensorDataStats();
  
  if (currentStats.totalRecords > 0) {
    console.log('🗑️ [UTIL] Clearing existing sensor data for fresh start...');
    clearAllSensorData();
  } else {
    console.log('✅ [UTIL] No existing sensor data to clear');
  }
};