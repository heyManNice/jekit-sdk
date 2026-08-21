

// 当用户启用屏幕阅读器的时候，播报文本
export function speak(text: string) {
    const id = "aria-live-speaker";
    const ariaLiveTitle = document.getElementById(id);
    if (ariaLiveTitle) {
        ariaLiveTitle.textContent = text;
    } else {
        const ariaLiveTitle = document.createElement("div");
        ariaLiveTitle.id = id;
        ariaLiveTitle.setAttribute("aria-live", "assertive");
        ariaLiveTitle.setAttribute("aria-atomic", "true");
        ariaLiveTitle.className = "sr-only";
        document.body.prepend(ariaLiveTitle);
        ariaLiveTitle.textContent = text;
    }
}