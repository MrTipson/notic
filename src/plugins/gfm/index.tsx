import remarkGfm from 'remark-gfm';
import { NoticPlugin } from '..';

export const title: NoticPlugin['title'] = 'Github flavored markdown'
export const description: NoticPlugin['description'] = 'This plugin adds features from github flavored markdown, \
such as automatic links, footnotes, strikethrough, tables and tasklists.'

export const options: NoticPlugin['options'] = {
    remarkPlugins: [remarkGfm]
}
