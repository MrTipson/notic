import { StateSetter } from "./Editor";

interface EditPaneProps {
    className?: string,
    content: string,
    setContent: StateSetter<string>,
}

const style = 'bg-c2-fill resize-none font-mono text-c2 caret-c1 p-2 my-2 mx-4 ';
export default function EditPane(props: EditPaneProps) {
    const { className, content, setContent } = props;
    return (
        <textarea className={style + className} onChange={x => setContent(x.target.value)} value={content}/>
    );
}