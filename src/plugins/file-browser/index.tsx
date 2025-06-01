import { NoticPlugin } from "@/plugins";
import FileBrowser from "./FileBrowser";

export const { title, description, apply, uiComponents }: NoticPlugin = {
    title: 'File browser',
    description: 'This plugin provides a file browser component.',
    uiComponents: { default: FileBrowser },
};
