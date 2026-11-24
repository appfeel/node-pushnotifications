# Contributing

## Setup

Requires Node.js 20 or later.

```bash
git clone https://github.com/appfeel/node-pushnotifications.git
cd node-pushnotifications
npm ci
```

## Commands

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm test`           | Run the tests (mocha)                      |
| `npm run test-cover` | Run the tests with a coverage report (nyc) |
| `npm run lint`       | ESLint and Prettier check                  |
| `npm run lint:fix`   | Fix ESLint and Prettier issues             |
| `npm run format`     | Format with Prettier                       |
| `npm run build`      | Compile `src/` to `lib/` with Babel        |

Source lives in `src/`. `lib/` is build output: it is gitignored and is what gets published.

## Pull requests

1. Fork the repo and create a branch from `master`.
2. Add tests for new behavior or bug fixes.
3. Update `README.md` or `docs/` if you change options, payload fields or results.
4. Make sure `npm test` and `npm run lint` pass. CI runs them on Node.js 20, 22, 24 and 26.

## Releases

Maintainers release with `npm run release` (release-it), which tags the version, creates the GitHub release and publishes to npm.
