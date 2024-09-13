import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Autosuggest from 'react-autosuggest';
import WeatherTable from '../components/WeatherTable';
import { fetchYrData } from './yr';
import { fetchDmiData } from './dmi';
import './Home.css';

const Home = () => {
    const [city, setCity] = useState('');
    const [allCities, setAllCities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [yrData, setYrData] = useState([]);
    const [dmiData, setDmiData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllCities = async () => {
            try {
                const response = await axios.get(`https://api.dataforsyningen.dk/steder`, {
                    params: {
                        hovedtype: 'Bebyggelse',
                        undertype: 'by',
                        per_side: 10000  
                    }
                });
                const cities = response.data.map(item => item.primærtnavn);
                setAllCities(cities);
            } catch (err) {
                console.error('Error fetching all cities', err);
                setError('Kunne ikke hente byliste.');
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
            if (response.data.length > 0 && response.data[0].visueltcenter && response.data[0].bbox) {
                const [lon, lat] = response.data[0].visueltcenter;
                return { lat, lon };
            } else {
                throw new Error('No results found');
            }
        } catch (err) {
            console.error('Error fetching location data', err);
            setError('Kunne ikke finde placering.');
            throw err;
        }
    };

    const handleSearch = async () => {
        try {
            const locationData = await getCoordinates(city);
            const { lat, lon } = locationData;
            const [yrWeather, dmiWeather] = await Promise.all([
                fetchYrData(lat, lon),
                fetchDmiData(lat, lon)
            ]);

            setYrData(Array.isArray(yrWeather) ? yrWeather : []);
            setDmiData(Array.isArray(dmiWeather) ? dmiWeather : []);
            
            setError(null);
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
        ).slice(0, 10); // Limiting to 10 suggestions
    };

    const debouncedGetSuggestions = useCallback(
        ({ value }) => {
            const suggestions = getSuggestions(value);
            setSuggestions(suggestions);
        },
        [allCities]
    );

    const onSuggestionsFetchRequested = ({ value }) => {
        debouncedGetSuggestions({ value });
    };

    const onSuggestionsClearRequested = () => {
        setSuggestions([]);
    };

    const getSuggestionValue = suggestion => suggestion;

    const renderSuggestion = suggestion => (
        <div className="suggestion-item">{suggestion}</div>
    );

    const onChange = (event, { newValue }) => {
        setCity(newValue);
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
                inputProps={{
                    placeholder: 'Indtast by',
                    value: city,
                    onChange: onChange
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
