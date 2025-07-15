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

import loginCoverImage from '#assets/loginCoverImage.jpg';
import Container from '#components/Container';
import Heading from '#components/Heading';
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
                if (!response) {
                    return;
                }

                if (response.ok) {
                    if (response.result) {
                        setUser({
                            id: response.result.id,
                            firstName: response.result.firstName,
                            lastName: response.result.lastName,
                            email: response.result.email,
                        });
                    }
                    alert.show(
                        'Logged in successfully!',
                        { variant: 'success' },
                    );
                    navigate('/');
                } else {
                    const errorMessages = response.errors
                        ?.map((err: { messages: string; }) => err.messages)
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
        <Page>
            <Container
                className={styles.banner}
            >
                <div>
                    <div className={styles.backgroundLayer}>
                        <img
                            className={styles.image}
                            src={loginCoverImage}
                            alt="login"
                        />
                    </div>
                    <div className={styles.content}>
                        <Heading
                            level={1}
                        >
                            CAPN-CMS
                        </Heading>
                        <div className={styles.description}>
                            Login to access the CAPN-CMS dashboard,
                            <br />
                            Manage content, and securely work with our team
                        </div>
                    </div>
                </div>
            </Container>

            <Container
                showHeader
                className={styles.formContainer}
                heading="USER LOGIN"
                childrenContainerClassName={styles.formContent}
            >
                <form
                    className={styles.form}
                    onSubmit={createSubmitHandler(validate, setError, handleFormSubmit)}
                >
                    <TextInput
                        name="email"
                        label="Email*"
                        placeholder="Enter email"
                        onChange={setFieldValue}
                        value={formValue?.email}
                        error={fieldError?.email}
                        autoFocus
                    />
                    <PasswordInput
                        name="password"
                        label="Password*"
                        placeholder="Enter password"
                        onChange={setFieldValue}
                        value={formValue?.password}
                        error={fieldError?.password}
                    />
                    <Button
                        className={styles.loginButton}
                        disabled={pristine || loginPending}
                        type="submit"
                        name="login"
                    >
                        Submit
                    </Button>
                </form>
            </Container>
        </Page>
    );
}

Component.displayName = 'Login';
