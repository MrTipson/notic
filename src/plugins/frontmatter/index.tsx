// @ts-ignore
import remarkFrontmatter from 'https://esm.sh/remark-frontmatter';
// @ts-ignore
import remarkMdxFrontmatter from 'https://esm.sh/remark-mdx-frontmatter';
import { NoticPlugin } from '..';

export const {title, description, options}: NoticPlugin = {
    title: 'Frontmatter',
    description: 'Parse frontmatter in the header of markdown files and export it a variable\
that can be used in the body or by external files.',
    options: {
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter]
    },
}
