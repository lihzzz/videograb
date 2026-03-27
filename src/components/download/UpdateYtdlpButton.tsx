import { useState } from "react";
import { RotateCcw, CheckCircle, AlertCircle, Wrench } from "lucide-react";
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
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleUpdate}
        disabled={isUpdatingYtdlp}
        size="sm"
        variant="outline"
        className="h-9 px-3 gap-2 bg-white/80 backdrop-blur-sm"
      >
        <Wrench className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">yt-dlp</span>
        <RotateCcw className={`h-3.5 w-3.5 ${isUpdatingYtdlp ? "animate-spin" : ""}`} />
        <span>{isUpdatingYtdlp ? "更新中" : "更新"}</span>
      </Button>

      {success && (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle className="h-3 w-3" />
          <span>更新成功</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>更新失败</span>
        </div>
      )}

      {!success && !error && (
        <p className="text-xs text-muted-foreground hidden md:block">
          置顶常驻，随时更新解析能力
        </p>
      )}
    </div>
  );
}
