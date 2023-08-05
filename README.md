# budget-tracker-be
Budget tracker back-end

### First run instructions

Required stack (WIP): Postgres v11, Node version specified in `.nvmrc`

1. Install dependencies
```sh
npm i
```

2. Create corresponding env variables.

Project uses different `.env` files for each environment: `.env.development`,
`.env.production`, `.env.test`.

Locally you only need `.env.development` and `.env.test`.
You can create it based on the `.env.template`. Just copy `.env.template`, rename it and fill missing
variables.

**Important.** In the `.env.test` you will need to use another name for the DB,
since when tests are running, they're automatically filling and cleaning the DB,
so all your data from the DB used for development might be lost.

3. Run migrations
```sh
npm run migrate:dev
```
If you have an error running this command, you probably need to install Postgres. Read [the guide below](#setup-postgres).

If you encountered any errors during `npm run migrate:dev`, you can run
`npm run migrate-undo:dev` to undo migrations. If you still facing issues, you
can clear the DB using these two commands:

```sh
drop schema public cascade;
create schema public;
```

They will completely clean the DB and you will be able to run migrations again.

4. Start dev server

```sh
npm run dev
```

### If you didn't work on it for long time

1. Make sure Postres v11 is running
2. Run `nvm use`
3. That's it!

### Setup Postgres

If you can access your user and you know how to create a DB, **you can ignore that section**.

If you don't know how to access your postgres user or DB:
1. Install Postgres.app for all existing postgres version [here](https://postgresapp.com/downloads.html) (it will install all needed Posgres versions).
2. Open the app, in the interface click on the "+" on the bottom left and add a new V11 server.
3. Click "Initialize" button from the interface.
4. If you have error "Post already in use", try to close apps that are using that port, or click on the server V11 in the interface and change port to 5433 (first option is much better)
5. Connect to default DB user using either "psql -h localhost -p 5432 -U postgres -d postgres" or just click on the "postgres" db in the Postgres.app. If you changed port on the previos step, update the port
6. Now run following commands to setup a user (update dumb values with your own):
  - "CREATE USER myuser WITH PASSWORD "secretpassword";"
  - ALTER ROLE myuser SUPERUSER;
  - CREATE DATABASE budget-tracker; (db-name will be used for the app)
7. That's it.

To install Redis (if you don't have one):
1. Install Redis via `brew install redis`
2. Then `brew services start redis`
3. You're done :)
