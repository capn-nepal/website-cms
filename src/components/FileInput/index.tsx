import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { IoTrash } from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    InputContainer,
    type InputContainerProps,
    useButtonFeatures,
} from '@togglecorp/toggle-ui';

import RawFileInput, { RawFileInputProps } from '#components/RawFIleInput';
import useDropHandler from '#hooks/useDropHandler';
import isValidFile, { ErrorType } from '#utils/common';

import styles from './styles.module.css';

type NameType = string | number | undefined;

type InheritedProps<T extends NameType> = (
    Omit<InputContainerProps, 'input'> &
    Omit<RawFileInputProps<T>, 'onChange' | 'value'>
);

export type Props<T extends NameType> = InheritedProps<T> & {
    inputElementRef?: React.RefObject<HTMLInputElement>;
    inputClassName?: string;
    labelClassName?: string;
    value: File | undefined | null;
    onChange: (file: File | null, name: T) => void;
    status?: string;
    showFileName?: boolean;
    placeholder?: string;
    maxFileSize?: number;
};

function FileInput<T extends NameType>(props: Props<T>) {
    const {
        className,
        disabled,
        error,
        errorContainerClassName,
        inputSectionClassName,
        inputContainerClassName,
        label,
        readOnly,
        uiMode,
        inputElementRef,
        containerRef,
        inputSectionRef,
        inputClassName,
        value,
        onChange,
        name: nameFromProps,
        accept,
        labelClassName,
        children,
        showFileName = true,
        maxFileSize = 10,
        ...fileInputProps
    } = props;

    const [internalError, setInternalError] = useState<string>();
    const [fileName, setFileName] = useState<string | undefined>(value?.name);

    useEffect(() => {
        setFileName(value?.name);
    }, [value]);

    const handleFileChange = useCallback((file: File | null) => {
        if (file) {
            const validity = isValidFile(file, maxFileSize, accept);
            if (!validity.isValid) {
                if (validity.errorType === ErrorType.invalidFileType) {
                    setInternalError('Invalid file type.');
                } else {
                    setInternalError(`File exceeds size limit of ${maxFileSize} MB.`);
                }
                onChange(null, nameFromProps);
                return;
            }
        }
        setInternalError(undefined);
        setFileName(file?.name);
        onChange(file, nameFromProps);
    }, [accept, maxFileSize, nameFromProps, onChange]);

    const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        handleFileChange(file || null);
        e.dataTransfer.clearData();
    }, [handleFileChange]);

    const {
        dropping,
        onDragOver,
        onDragEnter,
        onDragLeave,
        onDrop,
    } = useDropHandler(handleDrop);

    const {
        className: buttonLabelClassName,
        children: buttonLabelChildren,
    } = useButtonFeatures({
        className: labelClassName,
        disabled,
        variant: 'primary',
        children: (
            <>
                {children}
                <RawFileInput
                    className={styles.input}
                    inputRef={inputElementRef}
                    readOnly={readOnly}
                    uiMode={uiMode}
                    disabled={disabled}
                    name={nameFromProps}
                    accept={accept}
                    value={undefined}
                    onChange={handleFileChange}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...fileInputProps}
                />
            </>
        ),
    });

    return (
        <InputContainer
            className={_cs(styles.inputContainer, className)}
            containerRef={containerRef}
            inputContainerClassName={_cs(inputContainerClassName)}
            inputSectionClassName={_cs(styles.inputSection, inputSectionClassName)}
            errorContainerClassName={errorContainerClassName}
            inputSectionRef={inputSectionRef}
            disabled={disabled}
            error={error ?? internalError}
            label={label}
            readOnly={readOnly}
            actions={(
                <Button
                    name="clear"
                    type="button"
                    className={styles.clearButton}
                    onClick={() => handleFileChange(null)}
                    disabled={disabled}
                    transparent
                >
                    <IoTrash />
                </Button>

            )}
            input={(
                <div
                    className={_cs(
                        inputClassName,
                        styles.inputChildren,
                        dropping && styles.draggedOver,
                    )}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                >
                    <div className={styles.browseButton}>
                        <label className={buttonLabelClassName}>
                            {buttonLabelChildren}
                        </label>
                    </div>
                    {showFileName && fileName && (
                        <div className={styles.fileName}>
                            {fileName}
                        </div>
                    )}
                </div>
            )}
        />
    );
}

export default FileInput;
