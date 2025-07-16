// @ts-ignore
import remarkFrontmatter from 'https://esm.sh/remark-frontmatter';
// @ts-ignore
import remarkMdxFrontmatter from 'https://esm.sh/remark-mdx-frontmatter';
import { NoticPlugin } from '..';

export const { title, description, options, apply }: NoticPlugin = {
    title: 'Frontmatter',
    description: 'Parse frontmatter in the header of markdown files and export it a variable\
that can be used in the body or by external files.',
    options: {
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter]
    },
    apply: async ({ filename, props }) => {
        // resolve relative paths
        if (!!filename && !!props?.frontmatter) {
            const dirpath = filename.substring(0, filename.lastIndexOf('/'));
            const fm = props.frontmatter as { [index: string]: unknown };
            for (const k in fm) {
                if (typeof fm[k] === 'string' && (fm[k].startsWith('./') || fm[k].startsWith('../'))) {
                    fm[k] = dirpath + '/' + fm[k];
                }
            }
        }
    },
}
