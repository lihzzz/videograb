import { useEffect, useState } from "react";
import { Network, Save, XCircle } from "lucide-react";
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
      setMessage(normalizedDraftProxy ? "代理已保存并生效" : "已清除代理");
    } catch (err: any) {
      setMessage(err?.message || "保存代理失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Network className="h-4 w-4" />
        代理设置
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="例如: http://127.0.0.1:7890 或 socks5://127.0.0.1:1080"
          value={draftProxy}
          onChange={(e) => setDraftProxy(e.target.value)}
          disabled={isSaving}
        />
        <Button
          onClick={saveProxy}
          disabled={isSaving || !isDirty}
          className="min-w-[88px]"
        >
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setDraftProxy("");
          }}
          disabled={isSaving || !draftProxy}
        >
          <XCircle className="h-4 w-4 mr-2" />
          清空
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        留空表示直连。保存后，视频解析与下载都会使用该代理。
      </p>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
