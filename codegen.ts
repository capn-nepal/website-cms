import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: '/backend/schema.graphql',
    documents: [
        'src/**/*.tsx',
        'src/**/*.ts',
    ],
    ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        './generated/types/': {
            preset: 'client',
        },
    },
    config: {
        enumsAsTypes: true,
        scalars: {
            Date: 'string',
            DateTime: 'string',
        },
    },
};

export default config;
