import { useCallback } from "react";
import { StateSetter } from "./utils";

interface EditPaneProps {
    content: string,                        setContent: StateSetter<EditPaneProps['content']>,
    setUnsaved: StateSetter<boolean>,
}

export default function EditPane(props: EditPaneProps) {
    const { content, setContent, setUnsaved } = props;

    const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(x => {
        setContent(x.target.value);
        setUnsaved(true);
    }, [setContent, setUnsaved]);

    return (
        <textarea className='resize-none font-mono outline-none w-full h-full'
            onChange={onChange} value={content} tabIndex={-1}/>
    );
}