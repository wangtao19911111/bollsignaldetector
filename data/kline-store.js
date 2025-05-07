const config = require('../config');
// data/kline-store.js
let klines = [];

exports.addKline = (kline) => {
  klines.push(kline);
  if (klines.length > config.limit * 2) {
    klines = klines.slice(-config.limit * 2);
  }
  return klines;
};

exports.getKlines = () => klines;