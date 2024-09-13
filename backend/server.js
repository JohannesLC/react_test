const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE contacts (name TEXT, email TEXT, message TEXT)");
});


// Endpoint to get YR weather data
app.get('/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const yrApiUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  
  try {
    const response = await axios.get(yrApiUrl, {
      headers: {
        'User-Agent': 'MyTestApp/0.1'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dmi-weather', async (req, res) => {
    const { lat, lon } = req.query;
    const dmiApiKey = process.env.DMI_API_KEY;

    if (!lat || !lon) {
        return res.status(400).send('Latitude and longitude are required');
    }

    try {
        const response = await axios.get('https://dmigw.govcloud.dk/v1/forecastedr/point', {
            params: {
                'lat': lat,
                'lon': lon,
                'parameter-name': 'temperature-0m,wind-speed,total-precipitation',
                'start': new Date().toISOString(),
                'end': new Date(Date.now() + 10*24*60*60*1000).toISOString() // 10 days from now
            },
            headers: {
                'Authorization': `Bearer ${dmiApiKey}`
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching data from DMI API');
    }
});


// // Endpoint to get DMI weather data
// app.get('/dmi-weather', async (req, res) => {
//   console.log('Received request to /dmi-weather');
//   const { lat, lon } = req.query;

//   if (!lat || !lon) {
//     console.error('Missing lat or lon in query parameters');
//     return res.status(400).json({ error: 'Latitude (lat) and longitude (lon) are required' });
//   }

//   const dmiApiKey = process.env.DMI_API_KEY;
//   if (!dmiApiKey) {
//     console.error('Missing DMI API key');
//     return res.status(500).json({ error: 'DMI API key is not configured' });
//   }

//   const dmiApiUrl = 'https://dmigw.govcloud.dk/v1/forecastedr/collections/harmonie_dini_sf/position';

//   // Calculate the date range dynamically in RFC3339 format
//   const currentDate = new Date();
//   const endDate = new Date();
//   endDate.setDate(currentDate.getDate() + 9); // Add 9 days to the current date

//   const toRFC3339 = (date) => {
//     return date.toISOString(); // ISO 8601 format is compliant with RFC 3339
//   };

//   const datetimeParam = `${toRFC3339(currentDate)}/${toRFC3339(endDate)}`;

//   const params = {
//     coords: `POINT(${lon} ${lat})`,
//     'api-key': dmiApiKey,
//     'parameter-name': 'temperature-0m,wind-speed,total-precipitation',
//     'crs': 'native',
//     'format': 'CoverageJSON',
//     'datetime': datetimeParam
//   };

//   try {
//     console.log(`Sending request to DMI API: ${dmiApiUrl} with params`, params);

//     const response = await axios.get(dmiApiUrl, { params });

//     console.log('DMI API response received successfully');
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error making request to DMI API:', error.message);
//     if (error.response) {
//       // Log more details of the response
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', JSON.stringify(error.response.data));
//     }
//     res.status(500).json({ error: 'Error retrieving weather data from DMI API', details: error.message });
//   }
// });



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


app.get('/api/contacts', (req, res) => {
  db.all("SELECT * FROM contacts", [], (err, rows) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else {
      res.json(rows);
    }
  });
});