import { NoticPlugin } from "@/plugins";
import { z } from 'https://esm.sh/zod';
import { generateMock } from 'https://esm.sh/@anatine/zod-mock';
 
export const { title, description, apply }: NoticPlugin = {
    title: 'Placeholders',
    description: 'This plugin will make sure that the \'children\' and any schema props are set when rendering a file.',
    apply: async ({ props }) => {
        if ('schema' in props && typeof props.schema === 'function') {
            const schema = props.schema(z);
            const mock = generateMock(schema);
            for (const k in mock) {
                props[k] = mock[k];
            }
        }
        if (!props.hasOwnProperty('children')) {
            props.children = <div className='py-24 border border-green-400 text-c1 text-center'>Placeholder children</div>
        }
    },
};
