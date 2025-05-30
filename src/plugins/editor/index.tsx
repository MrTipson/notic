import { NoticPlugin } from "@/plugins";
import Editor from "./Editor";

export const { title, description, apply, component }: NoticPlugin = {
    title: 'Editor',
    description: 'This plugin provides an editor component',
    component: Editor,
};
