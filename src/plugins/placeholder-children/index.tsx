import { NoticPlugin } from "..";
 
export const { title, description, apply }: NoticPlugin = {
    title: 'Placeholder children',
    description: 'This plugin will make sure that the \'children\' prop is set when rendering a file.',
    apply: async (_api, props) => {
        if (!props.hasOwnProperty('children')) {
            props.children = <div className='py-24 border border-green-400 text-c1 text-center'>Placeholder children</div>
        }
    },
};
