import { useEffect } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { initEventListeners, useDownloadStore } from "./stores/downloadStore";

function App() {
  useEffect(() => {
    // 初始化 Tauri 事件监听
    initEventListeners();
    useDownloadStore.getState().syncProxyConfig().catch((err) => {
      console.error("同步代理配置失败:", err);
    });
  }, []);

  return <MainLayout />;
}

export default App;
