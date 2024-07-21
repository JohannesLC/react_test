import symbolMappings from './symbolMappings';

const loadWeatherIcon = async (symbol) => {
  const iconFilename = symbolMappings[symbol];
  if (!iconFilename) {
    console.error(`Icon for symbol ${symbol} not found`);
    return null;
  }

  try {
    const icon = await import(`../symbols/darkmode/svg/${iconFilename}.svg`);
    return icon.default;
  } catch (error) {
    console.error(`Error loading icon for symbol ${symbol}`);
    return null;
  }
};

export default loadWeatherIcon;
