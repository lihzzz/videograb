/**
 * Cookies 验证结果类型定义
 */
export type CookieValidationResult = {
  isValid: boolean;
  format: 'netscape' | 'json' | 'raw' | 'file_path' | 'unknown';
  error?: string;
};

/**
 * 单个 Cookie 项目的类型定义 (用于 JSON 格式)
 */
export type JsonCookieItem = {
  domain: string;
  name: string;
  value: string;
  path?: string;
  expirationDate?: number;
  httpOnly?: boolean;
  secure?: boolean;
  hostOnly?: boolean;
  sameSite?: string;
};

/**
 * Cookies 验证工具
 * 提供多种方式来验证 cookies 的有效性
 */
export class CookieValidator {
  /**
   * 验证 Netscape 格式的 cookies 文件内容
   * 格式: domain<TAB>flag<TAB>path<TAB>secure<TAB>expiration<TAB>name<TAB>value
   */
  static validateNetscapeFormat(content: string): boolean {
    const lines = content.split('\n');

    // 至少需要有一行非注释的有效数据
    const validLines = lines.filter(line => {
      if (line.trim() === '' || line.startsWith('#')) {
        return false; // 忽略空行和注释
      }

      // 检查是否符合 Netscape 格式（至少包含 7 个字段，用制表符分隔）
      const parts = line.split('\t');
      if (parts.length >= 7) {
        // 检查域名是否看起来合法
        const domain = parts[0].trim();
        if (domain && (domain.includes('.') || domain.startsWith('.'))) {
          // 检查是否有 name=value 格式的数据
          const name = parts[5].trim();
          const value = parts[6].trim();
          return name && value;
        }
      }
      return false;
    });

    return validLines.length > 0;
  }

  /**
   * 验证 JSON 格式的 cookies
   */
  static validateJsonFormat(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // 检查是否为 cookies 数组
        return parsed.every(cookie =>
          typeof cookie === 'object' &&
          cookie !== null &&
          typeof cookie['name'] === 'string' &&
          typeof cookie['value'] === 'string'
        );
      } else if (typeof parsed === 'object') {
        // 检查是否包含 cookies 数组
        return Array.isArray(parsed.cookies) &&
          parsed.cookies.every((cookie: JsonCookieItem) =>
            typeof cookie === 'object' &&
            cookie !== null &&
            typeof cookie.name === 'string' &&
            typeof cookie.value === 'string'
          );
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 验证原始 cookies 字符串格式 (name=value; name2=value2)
   */
  static validateRawFormat(content: string): boolean {
    // 移除可能的头部信息
    const trimmed = content.replace(/^\s*document\.cookie\s*=\s*["']?|["']?\s*;?\s*$/g, '');

    // 按分号分割
    const pairs = trimmed.split(';').filter(pair => pair.trim());

    if (pairs.length === 0) return false;

    // 检查每个键值对的格式
    for (const pair of pairs) {
      const [name, ...rest] = pair.trim().split('=');
      if (!name || rest.length === 0) {
        return false; // 没有等号或名字为空
      }
    }

    return true;
  }

  /**
   * 验证 cookies 内容的通用方法
   * 自动检测格式并验证
   */
  static validateCookies(content: string): CookieValidationResult {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return { isValid: true, format: 'unknown' }; // 空内容视为有效（未设置）
    }

    // 检查是否是文件路径
    if (trimmedContent.includes('/') || trimmedContent.includes('\\') ||
        trimmedContent.endsWith('.txt') || trimmedContent.endsWith('.json')) {
      return {
        isValid: true,
        format: 'file_path',
        error: undefined
      };
    }

    // 尝试解析 JSON 格式
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      const isJsonValid = this.validateJsonFormat(trimmedContent);
      return {
        isValid: isJsonValid,
        format: 'json',
        error: isJsonValid ? undefined : 'JSON 格式无效或缺少必要的 name/value 字段'
      };
    }

    // 检查是否包含制表符，这通常是 Netscape 格式
    if (trimmedContent.includes('\t')) {
      const isNetscapeValid = this.validateNetscapeFormat(trimmedContent);
      return {
        isValid: isNetscapeValid,
        format: 'netscape',
        error: isNetscapeValid ? undefined : 'Netscape cookies 格式无效（期望包含制表符分隔的域名、名称、值字段）'
      };
    }

    // 尝试原始 cookies 格式
    if (trimmedContent.includes('=')) {
      const isRawValid = this.validateRawFormat(trimmedContent);
      return {
        isValid: isRawValid,
        format: 'raw',
        error: isRawValid ? undefined : '原始 cookies 格式无效（期望 name=value; 格式）'
      };
    }

    return {
      isValid: false,
      format: 'unknown',
      error: '无法识别的 cookies 格式，请检查输入是否正确'
    };
  }
}

/**
 * 使用示例:
 *
 * const { isValid, format, error } = CookieValidator.validateCookies(cookiesContent);
 * if (!isValid) {
 *   console.error(`Cookies 验证失败: ${error}`);
 * }
 */