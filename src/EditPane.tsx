import { useCallback } from "react";
import { StateSetter } from "./utils";

interface EditPaneProps {
    className?: string,
    content: string,                        setContent: StateSetter<EditPaneProps['content']>,
    setUnsaved: StateSetter<boolean>,
}

const style = 'bg-c2-fill resize-none font-mono text-c2 caret-c1 p-2 my-2 mx-4 ';
export default function EditPane(props: EditPaneProps) {
    const { className, content, setContent, setUnsaved } = props;

    const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(x => {
        setContent(x.target.value);
        setUnsaved(true);
    }, [setContent, setUnsaved]);

    return (
        <textarea className={style + className} onChange={onChange} value={content}/>
    );
}