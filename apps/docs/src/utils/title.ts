import { speak } from "@/utils/aria";

export function setTitle(title: string) {
    document.title = title;
    speak("您现在处于" + title);
}