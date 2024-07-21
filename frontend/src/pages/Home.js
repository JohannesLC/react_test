import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Autosuggest from 'react-autosuggest';
import WeatherTable from '../components/WeatherTable';
import './Home.css';

const windDescriptions = [
  { max: 0.2, description: "Stille" },
  { max: 1.5, description: "Svag vind" },
  { max: 3.3, description: "Let vind" },
  { max: 5.4, description: "Let brise" },
  { max: 7.9, description: "Jævn brise" },
  { max: 10.7, description: "Frisk brise" },
  { max: 13.8, description: "Hård vind" },
  { max: 17.1, description: "Stiv kuling" },
  { max: 20.7, description: "Stormende kuling" },
  { max: 24.4, description: "Storm" },
  { max: 28.4, description: "Stærk storm" },
  { max: 32.6, description: "Orkan" },
];

const Home = () => {
  const [city, setCity] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [yrData, setYrData] = useState([]);
  const [dmiData, setDmiData] = useState([]);
  const [error, setError] = useState(null);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  useEffect(() => {
    const fetchAllCities = async () => {
      try {
        const response = await axios.get(`https://api.dataforsyningen.dk/steder`, {
          params: {
            hovedtype: 'Bebyggelse',
            undertype: 'by',
            per_side: 10000  // Fetching up to 10,000 cities
          }
        });
        const cities = response.data.map(item => item.primærtnavn);
        setAllCities(cities);
      } catch (err) {
        console.error('Error fetching all cities', err);
      }
    };

    fetchAllCities();
  }, []);

  const getCoordinates = async (cityName) => {
    try {
      const response = await axios.get(`https://api.dataforsyningen.dk/steder`, {
        params: {
          primærtnavn: cityName,
          srid: 4326
        }
      });
      if (response.data.length > 0 && response.data[0].visueltcenter) {
        const [lon, lat] = response.data[0].visueltcenter; // Get coordinates correctly
        return { lat, lon };
      } else {
        throw new Error('No results found');
      }
    } catch (err) {
      console.error('Error fetching coordinates', err);
      throw err;
    }
  };

  const handleSearch = async () => {
    try {
      const coordinates = await getCoordinates(city);
      if (coordinates) {
        const response = await axios.get(`/weather?lat=${coordinates.lat}&lon=${coordinates.lon}`);
        const groupedData = {};

        response.data.properties.timeseries.forEach(item => {
          const { time } = item;
          const date = new Date(time).toLocaleDateString();
          const { air_temperature, precipitation_amount, wind_speed } = item.data.instant.details;
          const weatherSymbol = item.data.next_1_hours ? item.data.next_1_hours.summary.symbol_code : 'unknown';
          
          if (!groupedData[date]) {
            groupedData[date] = {
              date,
              morning: `${air_temperature}°C, ${precipitation_amount ?? '0'} mm`,
              afternoon: `${air_temperature}°C, ${precipitation_amount ?? '0'} mm`,
              evening: `${air_temperature}°C, ${precipitation_amount ?? '0'} mm`,
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

          groupedData[date].details.push({
            time: new Date(time).toLocaleTimeString(),
            weather: weatherSymbol,
            temp: `${air_temperature}°C`,
            precip: `${precipitation_amount ?? '0'} mm`,
            wind: `${wind_speed} m/s`,
            windDesc
          });
        });

        const weatherData = Object.values(groupedData).map(item => ({
          ...item,
          highLow: `Høj: ${item.highLow.high}°C\nLav: ${item.highLow.low}°C`
        }));
        setYrData(weatherData);
        setError(null);
      }
    } catch (err) {
      setError('Fejl ved hentning af vejrdata');
      setYrData([]);
      setDmiData([]);
    }
  };

  const getSuggestions = value => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : allCities.filter(city =>
      city.toLowerCase().startsWith(inputValue)
    ).slice(0, 6).map(name => ({ name })); // Limiting to 6 suggestions
  };

  const debouncedGetSuggestions = useCallback(
    debounce(({ value }) => {
      const suggestions = getSuggestions(value);
      setSuggestions(suggestions);
    }, 300),
    [allCities]
  );

  const onSuggestionsFetchRequested = ({ value }) => {
    debouncedGetSuggestions({ value });
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = suggestion => suggestion.name;

  const renderSuggestion = suggestion => (
    <div className="suggestion-item">{suggestion.name}</div>
  );

  const onSuggestionSelected = (event, { suggestion }) => {
    setCity(suggestion.name);
  };

  return (
    <div className="home-container">
      <h1>Vejret i Danmark</h1>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={{
          placeholder: 'Indtast by',
          value: city,
          onChange: (e, { newValue }) => setCity(newValue)
        }}
      />
      <button onClick={handleSearch}>Søg</button>
      {error && <p>{error}</p>}
      <div className="tables-container">
        <WeatherTable title="YR Vejr" weatherData={yrData} />
        <WeatherTable title="DMI Vejr" weatherData={dmiData} />
      </div>
    </div>
  );
};

export default Home;
