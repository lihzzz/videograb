import { Input } from "../common/Input";
import { Settings2, Cookie, AlertCircle } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { CookieValidator } from "../../utils/cookieValidator";

export function CookiesConfig() {
  const cookies = useDownloadStore((state) => state.cookies);
  const setCookies = useDownloadStore((state) => state.setCookies);
  const syncCookiesConfig = useDownloadStore((state) => state.syncCookiesConfig);

  const validationResult = CookieValidator.validateCookies(cookies);

  const handleSyncCookies = async () => {
    await syncCookiesConfig();
  };

  const showError = cookies.trim() !== '' && !validationResult.isValid;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Cookie className="w-4 h-4 text-primary-600" />
        <h3 className="font-medium text-gray-900">Cookies 配置</h3>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={cookies}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCookies(e.target.value)}
              placeholder="输入 cookies 文件路径或内容..."
              className={`text-sm ${showError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {showError && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{validationResult.error || 'cookies 格式无效，请检查格式'}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSyncCookies}
            disabled={!cookies.trim() || !validationResult.isValid}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              cookies.trim() && validationResult.isValid
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">同步</span>
            </div>
          </button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>使用说明：</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>支持 Netscape 格式 (.txt)、JSON 格式或直接 cookies 字符串</li>
            <li>推荐使用浏览器插件导出 Netscape 格式的 cookies 文件</li>
            <li>对于 YouTube，可在登录状态下使用相关工具导出</li>
          </ul>
        </div>
      </div>
    </div>
  );
}