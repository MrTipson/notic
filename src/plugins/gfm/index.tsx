import remarkGfm from 'remark-gfm';
import { NoticPlugin } from '..';

export const { title, description, options}: NoticPlugin = {
    title: 'Github flavored markdown',
    description: 'This plugin adds features from github flavored markdown, \
such as automatic links, footnotes, strikethrough, tables and tasklists.',
    options: {
        remarkPlugins: [remarkGfm],
    } 
}
