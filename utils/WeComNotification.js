// utils/WeComNotification.js

const https = require('https');
const URL = require('url').URL;

class WeComNotification {
    constructor(config) {
        this.config = config.weCom;
    }

    async sendMessage(title, content, mentionedList = this.config.mentionedList) {
        if (!this.config.enabled) {
            console.warn('⚠️ 企业微信通知未启用');
            return;
        }

        const webhookUrl = this.config.webhookUrl;
        if (!webhookUrl || !webhookUrl.startsWith('https')) {
            console.warn('⚠️ 企业微信 Webhook 地址无效');
            return;
        }

        const message = `【${title}】\n\n${content}`;

        const payload = JSON.stringify({
            msgtype: 'text',
            text: {
                content: message,
                mentioned_list: mentionedList || [],
            },
        });

        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.errcode === 0) {
                            console.log('✅ 企业微信消息发送成功');
                            resolve();
                        } else {
                            console.error('❌ 企业微信消息发送失败:', result);
                            reject(new Error('企业微信推送失败'));
                        }
                    } catch (e) {
                        console.error('❌ 解析企业微信响应失败:', data);
                        reject(e);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ 请求企业微信接口出错:', error.message);
                reject(error);
            });

            req.write(payload);
            req.end();
        });
    }
}

module.exports = WeComNotification;