import '@toast-ui/editor/dist/toastui-editor.css';

import {
    useCallback,
    useRef,
} from 'react';
import { Editor } from '@toast-ui/react-editor';
import { _cs } from '@togglecorp/fujs';
import {
    InputContainer,
    InputContainerProps,
} from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

/** @knipignore */
export type MarkdownEditorProps<T> = Omit<InputContainerProps, 'input' | 'onChange' | 'name' | 'value'> & {
    name: T;
    onChange: (value: string | undefined, name: T) => void;
    editorClassName?: string;
    value?: string;
    disabled?: boolean;
    height?: string;
};

function MarkdownEditor<T extends string>(props: MarkdownEditorProps<T>) {
    const {
        name,
        value,
        onChange,
        editorClassName,
        actions,
        actionsContainerClassName,
        className,
        disabled,
        error,
        hint,
        hintContainerClassName,
        icons,
        iconsContainerClassName,
        inputSectionClassName,
        label,
        labelContainerClassName,
        readOnly,
        uiMode,
        height,
    } = props;

    const editorRef = useRef<Editor>(null);

    const handleChange = useCallback(() => {
        const markdown = editorRef.current?.getInstance().getMarkdown();
        onChange(markdown, name);
    }, [onChange, name]);

    return (
        <InputContainer
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={_cs(styles.container, className)}
            disabled={disabled}
            error={error}
            hint={hint}
            hintContainerClassName={hintContainerClassName}
            icons={icons}
            iconsContainerClassName={iconsContainerClassName}
            inputSectionClassName={inputSectionClassName}
            label={label}
            labelContainerClassName={labelContainerClassName}
            readOnly={readOnly}
            uiMode={uiMode}
            input={(
                <Editor
                    ref={editorRef}
                    initialValue={value}
                    previewStyle="vertical"
                    height={height}
                    initialEditType="markdown"
                    useCommandShortcut
                    hideModeSwitch
                    onChange={handleChange}
                    className={_cs(styles.editor, editorClassName)}
                    toolbarItems={[
                        ['heading', 'bold', 'italic', 'strike'],
                        ['hr', 'quote'],
                        ['ul', 'ol', 'task'],
                        ['table', 'link'],
                        ['code', 'codeblock'],
                    ]}

                />
            )}
        />
    );
}

export default MarkdownEditor;
