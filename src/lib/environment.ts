import { getRecentMeals } from './db';

export async function getEnvironmentalContext() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,cloud_cover`;
          const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
          
          const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
          const wData = await wRes.json();
          const aData = await aRes.json();
          
          const wCode = wData.current?.weather_code || 0;
          // map basic WMO codes
          let condition = "Clear";
          if (wCode > 50 && wCode < 70) condition = "Raining";
          if (wCode >= 70 && wCode < 80) condition = "Snowing";
          if (wCode >= 80) condition = "Stormy";
          if (wCode >= 1 && wCode <= 3) condition = "Cloudy";

          const recentMeals = await getRecentMeals(12);

          resolve({
            condition,
            temperature: wData.current?.temperature_2m,
            aqi: aData.current?.us_aqi,
            recentMeals
          });
        } catch (e) {
          resolve(null);
        }
      },
      (err) => resolve(null),
      { timeout: 5000 } // Don't block forever if user ignores prompt
    );
  });
}
