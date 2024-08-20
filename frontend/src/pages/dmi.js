// dmi.js
import axios from 'axios';
import { windDescriptions } from '../utils/windDescriptions';

export const fetchDmiData = async (lat, lon) => {
    try {
        const response = await axios.get(`/dmi-weather?lat=${lat}&lon=${lon}`);
        console.log(response, "DMI response")
        return processDmiWeatherData(response.data);
    } catch (error) {
        console.error('Error fetching DMI data', error);
        throw error;
    }
};

const processDmiWeatherData = (data) => {
    const groupedData = {};
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    

    const times = data.domain.axes.t.values;
    const temperatures = data?.ranges['temperature-0m']?.values;
    const windSpeeds = data?.ranges['wind-speed']?.values;
    const precipitations = data?.ranges['total-precipitation']?.values;
    
    if (!temperatures || !windSpeeds || !precipitations) {
        console.log(temperatures, windSpeeds, precipitations)
        console.error('Data missing in the API response');
        return; // Or handle the error as needed
    }
    

    const getTimeCategory = (hour) => {
        if (hour >= 0 && hour < 6) return 'night';
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    };

    times.forEach((time, index) => {
        const dateObj = new Date(time);
        const date = dateObj.toLocaleDateString();
        const hour = dateObj.getHours();
        
        // Skip entries before the current hour
        if (date === currentTime.toLocaleDateString() && hour < currentHour) return;

        const air_temperature = temperatures[index] - 273.15; // Convert from Kelvin to Celsius
        const wind_speed = windSpeeds[index];
        const precipitation_amount = precipitations[index];
        const timeCategory = getTimeCategory(hour);

        if (!groupedData[date]) {
            groupedData[date] = {
                date,
                night: '',
                morning: '',
                afternoon: '',
                evening: '',
                highLow: { high: air_temperature, low: air_temperature },
                precip: `${precipitation_amount.toFixed(1)} mm`,
                wind: `${wind_speed.toFixed(1)} m/s`,
                details: []
            };
        } else {
            groupedData[date].highLow.high = Math.max(groupedData[date].highLow.high, air_temperature);
            groupedData[date].highLow.low = Math.min(groupedData[date].highLow.low, air_temperature);
        }

        const windDesc = windDescriptions.find(desc => wind_speed <= desc.max)?.description || 'Unknown';

        groupedData[date][timeCategory] = `${air_temperature.toFixed(1)}°C, ${precipitation_amount.toFixed(1)} mm`;

        groupedData[date].details.push({
            time: dateObj.toLocaleTimeString(),
            weather: 'unknown', // Placeholder since DMI does not provide a weather symbol
            temp: `${air_temperature.toFixed(1)}°C`,
            precip: `${precipitation_amount.toFixed(1)} mm`,
            wind: `${wind_speed.toFixed(1)} m/s`,
            windDesc
        });
    });

    return Object.values(groupedData).map(item => ({
        ...item,
        highLow: `Høj: ${item.highLow.high.toFixed(1)}°C\nLav: ${item.highLow.low.toFixed(1)}°C`
    }));
};
