module.exports = {
    plugins: [
        'stylelint-no-unused-selectors',
        'stylelint-value-no-unknown-custom-properties',
    ],
    extends: [
        'stylelint-config-recommended',
        'stylelint-config-concentric',
    ],
    rules: {
        'csstools/value-no-unknown-custom-properties': [
            true, {
                importFrom: ['./src/index.css'],
            },
        ],
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
    },
};
