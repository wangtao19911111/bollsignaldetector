// binance-api.js
const ccxt = require('ccxt');
const proxyAgent = require('./proxy');
const config = require('./config');

const exchange = new ccxt.binance({
  timeout: 3000,
  agent: proxyAgent,
  options: {
    defaultType: 'future',
  },
});

module.exports = {
  fetchHistoricalData: async () => {
    const ohlcv = await exchange.fetchOHLCV(
      config.symbol,
      config.interval,
      undefined,
      config.limit + 10
    );
    return ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume,
    }));
  },
};