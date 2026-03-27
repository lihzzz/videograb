import { useState } from "react";
import { RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";

export function UpdateYtdlpButton() {
  const { isUpdatingYtdlp, updateYtdlp } = useDownloadStore();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleUpdate = async () => {
    setSuccess(false);
    setError(false);

    try {
      const result = await updateYtdlp();
      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(true);
        setTimeout(() => setError(false), 3000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      console.error("更新 yt-dlp 失败:", err);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className={`h-4 w-4 ${isUpdatingYtdlp ? 'animate-spin' : ''}`} />
          <h3 className="font-medium text-sm">更新 yt-dlp</h3>
        </div>
        <Button
          onClick={handleUpdate}
          disabled={isUpdatingYtdlp}
          size="sm"
          variant="outline"
          className="text-xs h-7"
        >
          {isUpdatingYtdlp ? '更新中...' : '检查更新'}
        </Button>
      </div>

      {success && (
        <div className="mt-2 flex items-center gap-2 text-green-600 text-xs">
          <CheckCircle className="h-3 w-3" />
          <span>yt-dlp 更新成功</span>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>更新失败，请重试</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        保持底层依赖更新，确保最佳兼容性和功能支持
      </p>
    </div>
  );
}