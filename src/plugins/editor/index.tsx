import { NoticPlugin } from "@/plugins";
import Editor from "./Editor";

export const { title, description, apply, uiComponents }: NoticPlugin = {
    title: 'Editor',
    description: 'This plugin provides an editor component',
    uiComponents: { default: Editor },
};
