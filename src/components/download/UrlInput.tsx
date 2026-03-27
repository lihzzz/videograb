import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const { fetchVideoInfo, isLoading, clearError } = useDownloadStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    clearError();
    await fetchVideoInfo(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="粘贴视频链接 (YouTube, Bilibili 等)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              解析
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
