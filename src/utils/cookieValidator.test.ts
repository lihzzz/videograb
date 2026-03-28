import { CookieValidator } from '../utils/cookieValidator';

// 测试用例
console.log('=== Cookies 验证器测试 ===\n');

// 测试 1: 有效的 Netscape 格式
console.log('测试 1: 有效的 Netscape 格式');
const netscapeCookie = `# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	2147483647	GAPS	xxxxxxx
.google.com	TRUE	/	FALSE	2147483647	SID	xxxxxxx`;
console.log(CookieValidator.validateCookies(netscapeCookie));
console.log('');

// 测试 2: 有效的 JSON 格式
console.log('测试 2: 有效的 JSON 格式');
const jsonCookie = `[{
  "domain": ".youtube.com",
  "expirationDate": 2147483647,
  "hostOnly": false,
  "httpOnly": false,
  "name": "VISITOR_INFO1_LIVE",
  "path": "/",
  "sameSite": "no_restriction",
  "secure": true,
  "session": false,
  "storeId": "0",
  "value": "xxxxxxx"
}]`;
console.log(CookieValidator.validateCookies(jsonCookie));
console.log('');

// 测试 3: 有效的原始 cookies 格式
console.log('测试 3: 有效的原始 cookies 格式');
const rawCookie = 'VISITOR_INFO1_LIVE=xxxxxxx; CONSENT=YES+CN+xx:en;';
console.log(CookieValidator.validateCookies(rawCookie));
console.log('');

// 测试 4: 文件路径
console.log('测试 4: 文件路径');
const filePath = '/path/to/cookies.txt';
console.log(CookieValidator.validateCookies(filePath));
console.log('');

// 测试 5: 无效格式
console.log('测试 5: 无效格式');
const invalidCookie = 'invalid cookie format';
console.log(CookieValidator.validateCookies(invalidCookie));
console.log('');

// 测试 6: 空内容
console.log('测试 6: 空内容');
const emptyCookie = '';
console.log(CookieValidator.validateCookies(emptyCookie));
console.log('');

console.log('=== 测试完成 ===');