// strategies/bollinger-volume.js
const { calculateSMA, calculateBollingerBands } = require('../utils/indicators');
const config = require('../config');
const WeComNotification = require('../utils/WeComNotification');
const fs = require('fs');
const path = require('path');

const weComNotifier = new WeComNotification(config);

// 创建日志目录和 CSV 文件路径
const logDir = path.resolve(__dirname, '../logs');
const csvFile = path.join(logDir, 'bollinger_volume_signal.csv');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// CSV 表头（只写一次）
const headers = [
  '时间',
  '收盘价',
  '最高价',
  '最低价',
  '上轨',
  '下轨',
  '成交量',
  '平均成交量',
  '是否放量',
  '信号类型'
].join(',') + '\n';

// 如果文件不存在，先写入表头
if (!fs.existsSync(csvFile)) {
  fs.writeFileSync(csvFile, headers);
}

// 封装 CSV 写入函数
function writeCsvLine(data) {
  const line = Object.values(data).map(v => `"${v}"`).join(',') + '\n';
  fs.appendFileSync(csvFile, line);
}

exports.checkSignal = (klines) => {
  if (klines.length < config.limit) return;

  const closes = klines.map(k => k.close);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  const volumes = klines.map(k => k.volume);

  const { upper, lower } = calculateBollingerBands(closes, config.limit);
  const lastClose = closes[closes.length - 1];
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];

  const lastUpper = upper[upper.length - 1];
  const lastLower = lower[lower.length - 1];

  const avgVolume = calculateSMA(volumes, config.limit).slice(-1)[0];
  const lastVolume = volumes[volumes.length - 1];

  const isVolumeSurge = lastVolume > avgVolume * config.volumeMultiplier;

  const now = new Date().toISOString();

  // 构造本次数据对象
  const logData = {
    时间: now,
    收盘价: lastClose.toFixed(6),
    最高价: lastHigh.toFixed(6),
    最低价: lastLow.toFixed(6),
    上轨: lastUpper.toFixed(6),
    下轨: lastLower.toFixed(6),
    成交量: lastVolume.toFixed(2),
    平均成交量: avgVolume.toFixed(2),
    是否放量: isVolumeSurge,
    信号类型: ''
  };

  // 判断买卖信号
  let signalType = '';
  if ((lastClose > lastUpper + config.threshold || lastHigh > lastUpper + config.maxThreshold) && isVolumeSurge) {
    signalType = '卖出信号';
    const msg = `🔴 卖出信号:\n当前价格 ${lastClose}, 上轨 ${lastUpper}, 成交量放大`;
    weComNotifier.sendMessage(msg, '', config.weCom.mentionedList);
    console.log(msg);
  } else if ((lastClose < lastLower - config.threshold || lastLow < lastLower - config.maxThreshold) && isVolumeSurge) {
    signalType = '买入信号';
    const msg = `🟢 买入信号:\n当前价格 ${lastClose}, 下轨 ${lastLower}, 成交量放大`;
    weComNotifier.sendMessage(msg, '', config.weCom.mentionedList);
    console.log(msg);
  }

  // 更新信号类型并写入 CSV
  logData.信号类型 = signalType;
  writeCsvLine(logData);
};