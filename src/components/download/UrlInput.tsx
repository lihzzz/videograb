import { useState } from "react";
import { Download, Link, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.form
      onSubmit={handleSubmit}
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="粘贴视频链接 (YouTube, Bilibili 等)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 w-full"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="min-w-[120px] whitespace-nowrap"
          variant="default"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              解析链接
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
