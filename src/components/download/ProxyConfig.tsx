import { useEffect, useState } from "react";
import { Network, Save, X } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function ProxyConfig() {
  const { proxy, setProxy, syncProxyConfig } = useDownloadStore();
  const [draftProxy, setDraftProxy] = useState(proxy);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftProxy(proxy);
  }, [proxy]);

  const normalizedDraftProxy = draftProxy.trim();
  const isDirty = normalizedDraftProxy !== proxy;

  const saveProxy = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      setProxy(normalizedDraftProxy);
      await syncProxyConfig();
      setMessage(normalizedDraftProxy ? "代理已保存并生效" : "已恢复默认代理");
    } catch (err: any) {
      setMessage(err?.message || "保存代理失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Network className="h-4 w-4" />
        代理设置
      </label>
      <div className="space-y-3">
        <div className="flex gap-2 flex-col sm:flex-row">
          <Input
            placeholder="默认: socks5://127.0.0.1:9999，可改成 http://127.0.0.1:7890"
            value={draftProxy}
            onChange={(e) => setDraftProxy(e.target.value)}
            disabled={isSaving}
            className="flex-1"
          />
          <Button
            onClick={saveProxy}
            disabled={isSaving || !isDirty}
            className="min-w-[88px] flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            保存
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setDraftProxy("socks5://127.0.0.1:9999");
            }}
            disabled={isSaving}
            className="min-w-[88px] flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            默认
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        默认使用本地代理 socks5://127.0.0.1:9999。保存后，视频解析与下载都会使用该代理。
      </p>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
