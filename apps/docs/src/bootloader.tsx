import "@/bootloader.css";
import '@lobehub/webfont-harmony-sans-sc/css/index.css';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createAppRouter } from "@/routes/router";
import { BackgroundGlow } from "@/components/glow-card";

// 等待首个路由模块加载完成之后再挂载到页面上
const router = await createAppRouter();
createRoot(document.querySelector("#react-app")!).render(
    <StrictMode>
        <BackgroundGlow />
        <RouterProvider router={router} />
    </StrictMode>
);
