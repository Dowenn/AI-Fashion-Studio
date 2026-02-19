// token-generator.js
const crypto = require('crypto');

// 设定你要生成的 Token 数量和每个 Token 的可用次数
const NUM_TOKENS = 5;
const QUOTA_PER_TOKEN = 10;

function generateTokens(count) {
  const tokens = [];
  for (let i = 0; i < count; i++) {
    // 生成随机字符串，结合 HORSE-2026 前缀，生成类似 HORSE-2026-A1B2C3D4 的酷炫凭证
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const token = `HORSE-2026-${randomPart}`;
    tokens.push({ token, quota: QUOTA_PER_TOKEN });
  }
  return tokens;
}

const newTokens = generateTokens(NUM_TOKENS);
console.log("🎉 成功生成以下 Token 批次，快去售卖吧！");
console.table(newTokens);
