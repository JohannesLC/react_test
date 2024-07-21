import React, { useState, useEffect } from 'react';
import loadWeatherIcon from '../utils/loadWeatherIcon';
import './WeatherTable.css';

const WeatherTable = ({ title, weatherData }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [icons, setIcons] = useState({});

  useEffect(() => {
    const loadIcons = async () => {
      const newIcons = {};
      for (const day of weatherData) {
        for (const detail of day.details) {
          if (!newIcons[detail.weather]) {
            newIcons[detail.weather] = await loadWeatherIcon(detail.weather);
          }
        }
      }
      setIcons(newIcons);
    };
    loadIcons();
  }, [weatherData]);

  const handleRowClick = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <div className="weather-table">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Dato</th>
            <th>Morgen</th>
            <th>Eftermiddag</th>
            <th>Aften</th>
            <th>Høj/Lav</th>
            <th>Nedbør</th>
            <th>Vind</th>
          </tr>
        </thead>
        <tbody>
          {weatherData.map((day, index) => (
            <React.Fragment key={index}>
              <tr onClick={() => handleRowClick(index)}>
                <td>{day.date}</td>
                <td>{day.morning}</td>
                <td>{day.afternoon}</td>
                <td>{day.evening}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{day.highLow}</td>
                <td>{day.precip}</td>
                <td>{day.wind}</td>
              </tr>
              {expandedRow === index && (
                <tr className="expanded-row">
                  <td colSpan="7">
                    <div className="detailed-info">
                      <table>
                        <thead>
                          <tr>
                            <th>Tid</th>
                            <th>Vejr</th>
                            <th>Temp.</th>
                            <th>Nedbør mm</th>
                            <th>Vind (stød) m/s</th>
                            <th>Vind beskrivelse</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.details.map((detail, detailIndex) => (
                            <tr key={detailIndex}>
                              <td>{detail.time}</td>
                              <td>
                                {icons[detail.weather] ? (
                                  <img src={icons[detail.weather]} alt={detail.weather} />
                                ) : (
                                  detail.weather
                                )}
                              </td>
                              <td>{detail.temp}</td>
                              <td>{detail.precip}</td>
                              <td>{detail.wind}</td>
                              <td>{detail.windDesc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeatherTable;
