# Changelog

## [2021-12-24] version 0.0.1

### Added TypeORM

Added TypeORM and configured it to work with Postgress.

- Refactored `User.ts` file to include TypeORM anotations.
- Created `ormconfig.json` file to define database connection to TypeORM.

TypeORM connects to database when app.ts runs. Connection is created by calling `createConnection` function.

## [2021-12-21] version 0.0.1

### Project started

Added:

- typescript and tsconfig.json
- eslintrc.json file
- express
- prettierrc.json file
- dockerfile and docker compose
- jest and jest.config.ts
- a sample service with tests
- github actions workflows for push and pull requests
