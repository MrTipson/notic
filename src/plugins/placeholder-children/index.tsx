import { NoticPlugin } from "..";

export const title: NoticPlugin['title'] = 'Placeholder children'
export const description: NoticPlugin['description'] = 'This plugin will make sure that the \'children\' prop is set when rendering a file.'

export const apply: NoticPlugin['apply'] = async (_api, props) => {
    if (!props.hasOwnProperty('children')) {
        props.children = <div className='py-24 border border-green-400 text-c1 text-center'>Placeholder children</div>
    }
}
