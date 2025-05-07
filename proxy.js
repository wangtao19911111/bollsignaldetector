// proxy.js
const { HttpsProxyAgent } = require('https-proxy-agent');
const config = require('./config');
let agent = null;

if (config.enableProxy) {
  const ProxyAgent = new HttpsProxyAgent(config.proxyUrl);
  agent = ProxyAgent;
}
// 导出 agent，可能为 null
module.exports = agent;