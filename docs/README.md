@webbeetechnologies/blueprint-nodejs / [Exports](modules.md)

# blueprint kysely nodejs
The blueprint kysely nodejs is a boilerplate for creating backend projects with consistent tooling, code style, and structure. It includes npm scripts, GitHub workflows, Jest for testing, and Google's Typescript Style guide (gts). To use this project, follow the getting started section, which include creating a dev branch on GitHub and setting up branch rules to ensure code quality. This project also includes rules for writing unit and e2e tests, as well as creating a clear readme for users.

On top of that it sets up a basic structure for a database based project, complete with migrations and associated commands for running and creating migrations. It also configures jest in a way, that tests are run in sqlite in an in-memory database, so that you can test mutating database operations. 

## Goal
- You have less work setting up all the boilerplate code for a database based project
- All the fundamentals in place: migrations, seeder, CI, testing, linting, code style, etc.
- Consistent tooling, code style and structure among all backend projects
- Test seeder with a deep database structure with which you can test almost anything database related
- Enforced pull request and code review workflow
- Enforced code quality with automated tests

## Getting started
- **Configure Github branch rules**
  - Create a new repo using this repo as a template
  - Checkout your repo, create a `dev` branch and push it to github. This is important before the next step as the next step requires that the `tests.yml` github action has run at least once.
  - Protect your `main` branch.
    - Go to Settings -> Branches -> Add rule -> Branch name pattern: `main` -> tick
    - Require branches to be up to date before merging
    - Require status checks to pass before merging
    - Select `tests` action
    - Do not allow bypassing the above settings
    - Click save
- **Remove db engines you don't need from `./kysely` and `package.json`**
    - The package `pg` and `pg-cursor` are required for the `postgres` engine
    - The package `mysql2` is required for the `mysql` engine
    - The package `better-sqlite3` is required for the `sqlite` engine
- run `yarn` to install all dependencies
- run `yarn run migration:run` to run all migrations
- Copy the `.env.sample` to `.env`

## Included
- **General scripts**
  - `yarn run start` - starts the `sample/index.ts` in watch mode with nodemon, restarts it if the code changes
  - `yarn run test` - runs tests including code coverage requirements
  - `yarn run test:watch` - runs tests in watch mode re-running related tests when code changes
  - `yarn run compile` - compiles the code to the build folder, runs automatically on release
  - `yarn run fix` - runs gts fix to normalize code style, runs automatically on push
  - `yarn doc:generate` - generates markdown documentation into the `./doc` folder, runs automatically on push
- **Database scripts**
  - `yarn migration:run` - runs all migrations in the `db/migrations` folder
  - `yarn migration:make` - creates a new migration file in the `db/migrations` folder
  - `yarn seed:test` - runs the test seeder, which seeds the database with a booking system database
- **Github workflows**
  - `format.yml` - runs gts fix on push to normalize code style
  - `release.yml` - to publish to our private registry if you create a release in Github
  - `tests.yml` - runs tests if you push or pull
- **Kysely**
  - `kysely/index.ts` - exports a kysqly instance as per the defined engine in `.env` you can import this with `import { kysely } from './kysely'` and use it to query the database
  - `kysely/samples` contains lots of samples for how to use kysely to query the database
- **Booking system database**
  - Migrations in `db/migrations` folder
  - Test seeder in `db/seeders` folder
- [gts (Google Typescript Style)](https://github.com/google/gts)
  - Typescript code style including prettier, eslint, tsconfig etc according to what google thinks makes sense.
- `getConfig` function in `src/getConfig.ts` to get a normalized config from environment variables

## Testing
- Uses jest for testing
- Runs tests in the `__tests__` folder or with the `.spec.ts` extension
- 80 % coverage requirement
- Before tests are run, the database is migrated to the latest version. Migrations are persisted in the test database is by default located at `storage/kysely.spec.sqlite3`, as configured in `.env.test`
- Tests are run in an in-memory sqlite database, so that you can test mutating database operations
- Please note that the db is not reset in between tests so if you mutate data in test A, this data is present in test B

## Rules
- Write unit tests directly in your code and not in a separate directory. Postfix them with `NAME_OF_YOUR_FILE.spec.ts`.
- Write e2e tests in the `__tests__` directory.
- Create a `readme.md` for your project which includes a "getting started" section with instructions on how to install and use this project. Make sure that getting started is easy.
- If you did not follow this rules, your epics are not considered to be done.

## Credit

- [Jest and github actions by Pedro Fonseca](https://medium.com/swlh/jest-and-github-actions-eaf3eaf2427d)
- [Jest and github actions by Joel Hooks](https://joelhooks.com/jest-and-github-actions/)
- [Auto formatting code using prettier and github actions by Mike Skelton](https://mskelton.medium.com/auto-formatting-code-using-prettier-and-github-actions-ed458f58b7df)
- [Github checks documentation](https://docs.github.com/en/rest/checks?apiVersion=2022-11-28)
- [Google Typescript Style](https://google.github.io/styleguide/tsguide.html)

## Database structure 
![](./resources/db_structure.png)

## ToDo:
- Add debug tutorial for vscode & intelij
- Add CI&CD
