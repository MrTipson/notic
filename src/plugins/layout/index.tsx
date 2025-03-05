import { NoticPlugin } from "..";
import { z } from 'zod';

export const { title, description, dependencies }: NoticPlugin = {
    title: 'Layouts and schemes',
    description: 'Set the \'layout\' field in the frontmatter to use another file as the layout. \
That file can optionally specify the additional frontmatter fields it requires to properly render the final output.',
    dependencies: Object.freeze(['frontmatter']),
};

export const apply: NoticPlugin['apply'] = async (api, props) => {
    
    const { frontmatter } = props;
    if (!frontmatter?.hasOwnProperty('layout')) {
        return;
    }

    const { default: MDXLayout, ...layoutProps } = await api.evaluate((frontmatter as any).layout);
    
    function wrapper({ frontmatter={}, children }: {frontmatter: object, children: any}) {

        if ('schema' in layoutProps && typeof layoutProps.schema === 'function') {
            const schema = layoutProps.schema(z);
            frontmatter = schema.parse(frontmatter);
        }

        return MDXLayout({...layoutProps, ...frontmatter, children });
    }
    
    Object.assign(props, { components: { wrapper }});
}
