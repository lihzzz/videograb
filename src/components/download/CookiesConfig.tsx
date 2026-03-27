import { Card, Input, Button, Tooltip } from "@/components/ui";
import { Settings2, Cookie, Upload, FileText } from "lucide-react";
import { useDownloadStore } from "@/stores/downloadStore";

export function CookiesConfig() {
  const cookies = useDownloadStore((state) => state.cookies);
  const setCookies = useDownloadStore((state) => state.setCookies);
  const syncCookiesConfig = useDownloadStore((state) => state.syncCookiesConfig);

  const handleSyncCookies = async () => {
    await syncCookiesConfig();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cookie className="w-4 h-4" />
        <h3 className="font-medium">Cookies 配置</h3>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder="输入 cookies 文件路径或内容..."
            className="flex-1 text-sm"
          />
          <Tooltip content="同步 Cookies 配置到下载器">
            <Button
              onClick={handleSyncCookies}
              variant="outline"
              size="sm"
              disabled={!cookies.trim()}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">同步</span>
            </Button>
          </Tooltip>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>使用说明：</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>支持直接输入 cookies 内容或 cookies 文件路径</li>
            <li>推荐使用浏览器插件导出 Netscape 格式的 cookies 文件</li>
            <li>对于 YouTube，可在登录状态下使用 <code>youtube-dl --cookies</code> 相关工具导出</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}