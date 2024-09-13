// dmi.js
import axios from 'axios';
import { windDescriptions } from '../utils/windDescriptions';

const apiBaseUrl = 'http://localhost:5000/api';

export const fetchDmiData = async (lat, lon) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/dmi-weather?lat=${lat}&lon=${lon}`);
        return processDMIWeatherData(response.data);
    } catch (error) {
        console.error('Error fetching DMI data', error);
        throw error;
    }
};

const processDMIWeatherData = (gribData) => {
    const groupedData = {};

    gribData.forEach(item => {
        const { time, temperature, windSpeed, precipitation } = item;
        const dateObj = new Date(time);
        const date = dateObj.toLocaleDateString();
        const hour = dateObj.getHours();

        // const weatherSymbol = getWeatherSymbol(item);  // Replace with logic to get the correct symbol
        
        const getTimeCategory = (hour) => {
            if (hour >= 0 && hour < 6) return 'night';
            if (hour >= 6 && hour < 12) return 'morning';
            if (hour >= 12 && hour < 18) return 'afternoon';
            return 'evening';
        };

        const timeCategory = getTimeCategory(hour);

        if (!groupedData[date]) {
            groupedData[date] = {
                date,
                night: '',
                morning: '',
                afternoon: '',
                evening: '',
                highLow: { high: temperature, low: temperature },
                precip: `${precipitation ?? '0'} mm`,
                wind: `${windSpeed} m/s`,
                details: []
            };
        } else {
            groupedData[date].highLow.high = Math.max(groupedData[date].highLow.high, temperature);
            groupedData[date].highLow.low = Math.min(groupedData[date].highLow.low, temperature);
        }

        const windDesc = windDescriptions.find(desc => windSpeed <= desc.max)?.description || 'Unknown';

        groupedData[date][timeCategory] = `${temperature}°C, ${precipitation ?? '0'} mm`;

        groupedData[date].details.push({
            time: dateObj.toLocaleTimeString(),
            // weather: weatherSymbol,
            temp: `${temperature}°C`,
            precip: `${precipitation ?? '0'} mm`,
            wind: `${windSpeed} m/s`,
            windDesc
        });
    });

    return Object.values(groupedData).map(item => ({
        ...item,
        highLow: `Høj: ${item.highLow.high}°C\nLav: ${item.highLow.low}°C`
    }));
};

