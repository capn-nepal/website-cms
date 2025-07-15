import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

export type RawFileInputProps<NAME extends number | string | undefined> = {
    id: string;
    accept?: string;
    disabled?: boolean;
    inputProps?: React.ComponentPropsWithoutRef<'input'>;
    inputRef?: React.RefObject<HTMLInputElement>;
    name: NAME;
    readOnly?: boolean;
    className?: string;
    children?: React.ReactNode;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function RawFileInput<NAME extends number | string | undefined>(props: RawFileInputProps<NAME>) {
    const {
        id,
        accept,
        disabled,
        inputProps,
        inputRef,
        name,
        onChange,
        readOnly,
        className,
        children,
    } = props;

    return (
        <label htmlFor={id} className={_cs(styles.fileInput, className)}>
            {children}
            <input
                id={id}
                className={styles.input}
                type="file"
                accept={accept}
                onChange={onChange}
                name={name !== undefined ? String(name) : undefined}
                ref={inputRef}
                disabled={disabled}
                readOnly={readOnly}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...inputProps}
            />
        </label>
    );
}

export default RawFileInput;
