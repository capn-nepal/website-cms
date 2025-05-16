import {
    useCallback,
    useContext,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    createSubmitHandler,
    emailCondition,
    getErrorObject,
    lengthGreaterThanCondition,
    lengthSmallerThanCondition,
    type ObjectSchema,
    PartialForm,
    requiredStringCondition,
    useForm,
} from '@togglecorp/toggle-form';
import {
    Button,
    PasswordInput,
    TextInput,
} from '@togglecorp/toggle-ui';

import Page from '#components/Page';
import UserContext from '#contexts/user';
import {
    LoginInput,
    LoginMutation,
    LoginMutationVariables,
} from '#generated/types/graphql';
import useAlert from '#hooks/useAlert';

import styles from './styles.module.css';

const LOGIN = gql`
    mutation Login($data: LoginInput!) {
        login(data: $data) {
            errors
            ok
            result {
                id
                email
                firstName
                displayName
                lastName
            }
        }
    }
`;

type FormType = PartialForm<LoginInput>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const formSchema: FormSchema = {
    fields: (): FormSchemaFields => ({
        email: {
            required: true,
            validations: [
                emailCondition,
            ],
            requiredValidation: requiredStringCondition,
        },
        password: {
            required: true,
            validations: [
                lengthGreaterThanCondition(4),
                lengthSmallerThanCondition(129),
            ],
            requiredValidation: requiredStringCondition,
        },
    }),
};

const defaultFormValue: FormType = {};

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const alert = useAlert();
    const navigate = useNavigate();
    const { setUserAuth: setUser } = useContext(UserContext);

    const {
        pristine,
        value: formValue,
        setFieldValue,
        error,
        setError,
        validate,
    } = useForm(formSchema, { value: defaultFormValue });

    const fieldError = getErrorObject(error);

    const [
        triggerLogin,
        { loading: loginPending },
    ] = useMutation<LoginMutation, LoginMutationVariables>(
        LOGIN,
        {
            onCompleted: (loginResponse) => {
                const response = loginResponse?.login;
                if (!response || !response.result) {
                    return;
                }

                if (response.ok) {
                    setUser({
                        id: response.result.id,
                        firstName: response.result.firstName,
                        lastName: response.result.lastName,
                        email: response.result?.email,
                    });
                    alert.show(
                        'Logged in successfully!',
                        { variant: 'success' },
                    );
                    navigate('/');
                } else {
                    const errorMessages = response?.errors
                        ?.map((errors: { messages: string; }) => errors.messages)
                        .filter(isDefined)
                        .join(', ');
                    alert.show(errorMessages, { variant: 'danger' });
                }
            },
            onError: () => {
                alert.show(
                    'Failed to login!',
                    { variant: 'danger' },
                );
            },
        },
    );

    const handleFormSubmit = useCallback(() => {
        const handler = createSubmitHandler(
            validate,
            setError,
            (val) => {
                triggerLogin({
                    variables: {
                        data: val as LoginInput,
                    },
                });
            },
        );
        handler();
    }, [
        setError,
        triggerLogin,
        validate,
    ]);

    return (
        <Page
            className={styles.login}
        >
            <form
                className={styles.form}
                onSubmit={handleFormSubmit}
            >
                <div className={styles.fields}>
                    <TextInput
                        name="email"
                        label="Email"
                        value={formValue.email}
                        onChange={setFieldValue}
                        error={fieldError?.email}
                        autoFocus
                    />
                    <PasswordInput
                        name="password"
                        label="Password"
                        value={formValue.password}
                        error={fieldError?.password}
                        onChange={setFieldValue}
                    />
                </div>
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        type="submit"
                        onClick={handleFormSubmit}
                        disabled={pristine || loginPending}
                    >
                        Login
                    </Button>
                </div>
            </form>
        </Page>
    );
}

Component.displayName = 'Login';
