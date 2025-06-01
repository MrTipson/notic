import { NoticPlugin } from "@/plugins";
import Layout from "./Layout";

export const { title, description, apply, uiComponents }: NoticPlugin = {
    title: 'App layout',
    description: 'This plugin provides an app layout component',
    uiComponents: { default: Layout },
};
