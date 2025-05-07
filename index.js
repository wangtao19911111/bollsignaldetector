// index.js
const { startWebSocket } = require('./ws-client');
const { getKlines, addKline } = require('./data/kline-store');
const { fetchHistoricalData } = require('./binance-api');

async function main() {
  // 获取历史数据
  const historicalData = await fetchHistoricalData();
  historicalData.forEach(addKline);
  console.log(`✅ 初始加载完成，共 ${getKlines().length} 根K线`);

  // 启动WebSocket实时监听
  startWebSocket();
}

main();