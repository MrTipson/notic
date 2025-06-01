import { NoticPlugin } from "@/plugins";
import PreviewPane from "./PreviewPane";

export const { title, description, apply, uiComponents }: NoticPlugin = {
    title: 'Preview pane',
    description: 'This plugin provides a preview pane component.',
    uiComponents: { default: PreviewPane },
};
