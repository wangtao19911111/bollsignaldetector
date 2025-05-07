// utils/indicators.js
exports.calculateSMA = (prices, period) => {
    const result = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      const slice = prices.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };
  
  exports.calculateBollingerBands = (prices, period, stdDev = 2) => {
    const sma = exports.calculateSMA(prices, period);
    const upper = [];
    const lower = [];
  
    for (let i = 0; i < prices.length; i++) {
      if (sma[i] === null) {
        upper.push(null);
        lower.push(null);
        continue;
      }
  
      const window = prices.slice(Math.max(0, i - period + 1), i + 1);
      const mean = sma[i];
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      const std = Math.sqrt(variance);
  
      upper.push(mean + std * stdDev);
      lower.push(mean - std * stdDev);
    }
  
    return { upper, lower };
  };