import symbolMappings from './symbolMappings';

const loadWeatherIcon = async (symbol) => {
  const iconFilename = symbolMappings[symbol] || 'unknown';
  try {
    const icon = await import(`../symbols/darkmode/svg/${iconFilename}.svg`);
    return icon.default;
  } catch (error) {
    console.error(`Error loading icon for symbol ${symbol}`);
    return null;
  }
};

export default loadWeatherIcon;