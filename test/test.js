import lint from 'mocha-eslint'; // eslint-disable-line import/no-extraneous-dependencies

lint(['src'], {
    strict: true,
    timeout: 5000,
});

