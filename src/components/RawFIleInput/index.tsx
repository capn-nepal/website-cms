import {
    useCallback,
    useState,
} from 'react';
import {
    _cs,
    randomString,
} from '@togglecorp/fujs';
import type { ButtonProps } from '@togglecorp/toggle-ui';
import { useButtonFeatures } from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

export type RawFileInputProps<NAME extends number | string | undefined> = ButtonProps<NAME> & {
    accept?: string;
    disabled?: boolean;
    inputProps?: React.ComponentPropsWithoutRef<'input'>;
    inputRef?: React.RefObject<HTMLInputElement>;
    name: NAME;
    value?: string;
    readOnly?: boolean;
    onChange: (file: File | null, name: NAME) => void;
};

function RawFileInput<NAME extends number | string | undefined>(props: RawFileInputProps<NAME>) {
    const {
        accept,
        disabled,
        inputProps,
        inputRef,
        name,
        onChange,
        readOnly,
        ...buttonFeatureProps
    } = props;

    const [inputId] = useState(randomString());

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const uploadedFile = e.target.files?.[0] ?? null;
            onChange(uploadedFile, name);
        },
        [onChange, name],
    );

    const {
        children,
        className,
    } = useButtonFeatures({
        ...buttonFeatureProps,
        disabled,
    });

    return (
        <label
            htmlFor={inputId}
            className={_cs(styles.fileInput, className)}
        >
            {children}
            <input
                id={inputId}
                className={styles.input}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                name={typeof name === 'string' ? name : undefined}
                ref={inputRef}
                disabled={disabled}
                readOnly={readOnly}
                {...inputProps} // eslint-disable-line react/jsx-props-no-spreading
            />
        </label>
    );
}

export default RawFileInput;
