// yr.js
import axios from 'axios';
import { windDescriptions } from '../utils/windDescriptions';

const apiBaseUrl = 'http://localhost:5000/api';


export const fetchYrData = async (lat, lon) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/weather?lat=${lat}&lon=${lon}`);
        return processWeatherData(response.data);
    } catch (error) {
        console.error('Error fetching YR data', error);
        throw error;
    }
};

const processWeatherData = (data) => {
    const groupedData = {};
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    const getTimeCategory = (hour) => {
        if (hour >= 0 && hour < 6) return 'night';
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    };

    // Check if timeseries is defined before proceeding
    if (!data?.properties?.timeseries) {
        console.error('YR data timeseries is undefined');
        return [];
    }

    data.properties.timeseries.forEach(item => {
        const { time } = item;
        const dateObj = new Date(time);
        const date = dateObj.toLocaleDateString();
        const hour = dateObj.getHours();

        // Skip entries before the current hour
        if (date === currentTime.toLocaleDateString() && hour < currentHour) return;

        const { air_temperature, precipitation_amount, wind_speed } = item.data.instant.details;
        const weatherSymbol =
            item.data.next_1_hours?.summary.symbol_code ||
            item.data.next_6_hours?.summary.symbol_code ||
            item.data.next_12_hours?.summary.symbol_code;

        // Skip entries with undefined weatherSymbol
        if (!weatherSymbol) {
            return;
        }

        const timeCategory = getTimeCategory(hour);

        if (!groupedData[date]) {
            groupedData[date] = {
                date,
                night: '',
                morning: '',
                afternoon: '',
                evening: '',
                highLow: { high: air_temperature, low: air_temperature },
                precip: `${precipitation_amount ?? '0'} mm`,
                wind: `${wind_speed} m/s`,
                details: []
            };
        } else {
            groupedData[date].highLow.high = Math.max(groupedData[date].highLow.high, air_temperature);
            groupedData[date].highLow.low = Math.min(groupedData[date].highLow.low, air_temperature);
        }

        const windDesc = windDescriptions.find(desc => wind_speed <= desc.max)?.description || 'Unknown';

        groupedData[date][timeCategory] = `${air_temperature}°C, ${precipitation_amount ?? '0'} mm`;

        groupedData[date].details.push({
            time: dateObj.toLocaleTimeString(),
            weather: weatherSymbol,
            temp: `${air_temperature}°C`,
            precip: `${precipitation_amount ?? '0'} mm`,
            wind: `${wind_speed} m/s`,
            windDesc
        });
    });

    return Object.values(groupedData).map(item => ({
        ...item,
        highLow: `Høj: ${item.highLow.high}°C\nLav: ${item.highLow.low}°C`
    }));
};

