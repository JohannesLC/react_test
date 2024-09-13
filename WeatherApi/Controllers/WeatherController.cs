using System.Globalization;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

[ApiController]
[Route("api")]
public class WeatherController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WeatherController> _logger;
    private readonly IConfiguration _configuration;

    public WeatherController(HttpClient httpClient, ILogger<WeatherController> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("weather")]
    public async Task<IActionResult> GetYrWeather([FromQuery] double lat, [FromQuery] double lon)
    {
        // Ensuring proper formatting for lat/lon in culture-invariant way
        var yrApiUrl = $"https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat.ToString(CultureInfo.InvariantCulture)}&lon={lon.ToString(CultureInfo.InvariantCulture)}";

        try
        {
            // Preparing the HTTP request
            var request = new HttpRequestMessage(HttpMethod.Get, yrApiUrl);
            request.Headers.Add("User-Agent", "MyTestApp/0.1 (myemail@example.com)");

            // Sending the HTTP request
            var response = await _httpClient.SendAsync(request);

            // If the response is not successful, return the status code and message
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);

            // Reading the response content
            var result = await response.Content.ReadAsStringAsync();

            // Returning the parsed result as the response
            return Ok(result);
        }
        catch (System.Exception ex)
        {
            // Log the error and return a 500 status code
            _logger.LogError(ex, "An error occurred while fetching weather data from YR API");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("dmi-weather")]
    public async Task<IActionResult> GetDmiWeather([FromQuery] double lat, [FromQuery] double lon)
    {
        // Retrieve the API key from appsettings.json
        var apiKey = _configuration["DMI_API_KEY"];

        // Ensure the key is present
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("DMI API Key is missing in appsettings.json");
            return StatusCode(500, new { error = "DMI API Key is missing" });
        }

        double bboxSize = 0.01; // Adjust as necessary for precision
        double minLon = lon - bboxSize;
        double minLat = lat - bboxSize;
        double maxLon = lon + bboxSize;
        double maxLat = lat + bboxSize;
        string bbox = $"{minLon.ToString(CultureInfo.InvariantCulture)},{minLat.ToString(CultureInfo.InvariantCulture)},{maxLon.ToString(CultureInfo.InvariantCulture)},{maxLat.ToString(CultureInfo.InvariantCulture)}";


        var startDate = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        var endDate = DateTime.UtcNow.AddDays(5).ToString("yyyy-MM-ddTHH:mm:ssZ"); // 5 days ahead

        _logger.LogInformation("Fetching forecast from {StartDate} to {EndDate}", startDate, endDate);

        // Assemble the API URL
        var dmiApiUrl = $"https://dmigw.govcloud.dk/v1/forecastdata/collections/harmonie_dini_sf/items?" +
                       $"bbox={bbox}&" +
                       $"datetime={startDate}/{endDate}&" +
                       $"limit=100&" +
                       $"api-key={apiKey}";

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, dmiApiUrl);
            request.Headers.Add("User-Agent", "YourApp/0.1 (your.email@example.com)");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);

            var result = await response.Content.ReadAsStringAsync();

            // Log the response content for debugging (if necessary)
            // _logger.LogInformation("DMI Weather API Response: {0}", result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching weather data from DMI");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
