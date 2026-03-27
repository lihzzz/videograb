import { useDownloadStore } from "../../stores/downloadStore";
import { DownloadCard } from "./DownloadCard";
import { motion } from "framer-motion";

export function DownloadList() {
  const { tasks } = useDownloadStore();

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 text-muted-foreground bg-card-secondary rounded-xl border-2 border-dashed border-border p-8"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>
        <h3 className="font-semibold text-lg text-gray-900 mb-1">暂无下载任务</h3>
        <p className="text-sm">添加视频链接开始下载</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-gray-900">下载任务</h3>
        <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {tasks.length} 个任务
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DownloadCard task={task} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
