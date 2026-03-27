import { useState } from "react";
import { ListVideo, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useDownloadStore } from "../../stores/downloadStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function PlaylistConfig() {
  const { playlistParams, updatePlaylistParams } = useDownloadStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleParamChange = (param: keyof typeof playlistParams, value: any) => {
    updatePlaylistParams({ [param]: value });
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <ListVideo className="h-4 w-4 text-primary-600" />
          <h3 className="font-medium text-sm">播放列表设置</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">开始位置</label>
              <Input
                type="number"
                min="1"
                value={playlistParams.start}
                onChange={(e) => handleParamChange('start', parseInt(e.target.value) || 1)}
                className="text-sm h-8"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">结束位置</label>
              <Input
                type="number"
                min="1"
                value={playlistParams.end || ''}
                onChange={(e) => handleParamChange('end', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="留空表示到最后"
                className="text-sm h-8"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">指定项目 (可选)</label>
            <Input
              type="text"
              value={playlistParams.items}
              onChange={(e) => handleParamChange('items', e.target.value)}
              placeholder="例如: 1,3,5-10"
              className="text-sm h-8"
            />
            <p className="text-xs text-muted-foreground mt-1">格式: 1,2,5 或 1-3 或 1,3,5-10</p>
          </div>
        </div>
      )}
    </div>
  );
}