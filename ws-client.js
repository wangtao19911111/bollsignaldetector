// ws-client.js
const WebSocket = require('ws');
const proxyAgent = require('./proxy');
const config = require('./config');
const { addKline, getKlines } = require('./data/kline-store');
const { checkSignal } = require('./strategies/bollinger-volume');

let reconnectAttempts = 0;
let pingInterval = null;
let lastProcessedKlineTime = null;

exports.startWebSocket = () => {
  const wsOptions = proxyAgent ? { agent: proxyAgent } : {};
  const ws = new WebSocket(`wss://fstream.binance.com/ws/${config.symbol.toLowerCase()}@kline_${config.interval}`, wsOptions);

  // WebSocket 打开事件
  ws.on('open', () => {
    console.log('✅ WebSocket 连接已建立');
    reconnectAttempts = 0;

    // 启动心跳
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        console.log('📡 发送 WebSocket ping');
      }
    }, 30 * 1000);
  });

  // 接收 pong 回应
  ws.on('pong', () => {
    console.log('🟢 收到 pong，连接正常');
  });

  // 接收消息
  ws.on('message', (data) => {
    try {
      const json = JSON.parse(data.toString());

      // 忽略非 K 线数据（如 ping/pong）
      if (!json.k || !json.k.x) return;

      const kline = json.k;

      // 提取关键字段
      const timestamp = parseInt(kline.t);
      const closePrice = parseFloat(kline.c);
      const volume = parseFloat(kline.v);

      // 防止重复处理同一个 K 线
      if (lastProcessedKlineTime === timestamp) {
        return;
      }

      const newKline = {
        timestamp: new Date(timestamp),
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: closePrice,
        volume: volume,
      };

      lastProcessedKlineTime = timestamp;
      addKline(newKline);
      checkSignal(getKlines());
    } catch (err) {
      console.error('❌ WebSocket 消息处理失败:', err.message);
      console.error('原始数据:', data.toString());
    }
  });

  // 错误处理
  ws.on('error', (err) => {
    console.error('❌ WebSocket 出现错误:', err.message);
  });

  // 连接关闭
  ws.on('close', (code, reason) => {
    console.warn(`🔌 WebSocket 已关闭 [${code}] ${reason.toString()}`);
    clearInterval(pingInterval);

    // 自动重连
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // 指数退避
    console.log(`🔄 尝试第 ${reconnectAttempts} 次重连，等待 ${delay / 1000} 秒`);
    setTimeout(exports.startWebSocket, delay);
  });
};