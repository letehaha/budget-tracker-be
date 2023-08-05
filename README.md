# budget-tracker-be
Budget tracker back-end

### First run instructions

Required stack (WIP): Postgres v11, Node version specified in `.nvmrc`

1. Install dependencies
```sh
npm i
```

2. Project uses different `.env` files for each environment: `.env.development`,
`.env.production`, `.env.test`. Locally you only need `.env.development`. You can create
it based on the `.env.template`. Just copy `.env.template`, rename it and fill missing
variables. You can omit `API_LAYER_API_KEY` for now, it's not really needed.

3. Run migrations
```sh
npm run migrate:dev
```

4. Start dev server

```sh
npm run dev
```

### If you didn't work on it for long time

1. Make sure Postres v11 is running
2. Run `nvm use`
3. That's it!

### Guide to setup postgres DB and Redis from scratch

If you can access your user and you know how to create a DB, **you can ignore that section**.

If you don't know how to access your postgres user or DB:
1. Install Postgres.app for all existing postgres version [here](https://postgresapp.com/downloads.html) (it will install all needed Posgres versions).
2. Open the app, in the interface click on the "+" on the bottom left and add a new V11 server.
3. Click "Initialize" button from the interface.
4. If you have error "Post already in use", try to close apps that are using that port. Otherwise click on the server V11 in the interface and change port to 5433
5. Connect to default DB user using "psql -h localhost -p 5432 -U postgres -d postgres". If you changed port on the previos step, update the port
6. Now run following commands to setup a user (update dumb values with you own):
  - "CREATE USER `myuser` WITH PASSWORD `'secretpassword'`;"
  - ALTER ROLE `myuser` SUPERUSER;
  - CREATE DATABASE `db-name`; (db-name will be used for the app)
  - \d (to close the connection)
  - psql -h localhost -p 5432 -U `myuser` -d `db-name`
7. That's it.

To install Redis (if you don't have one):
1. Install Redis via `brew install redis`
2. Then `brew services start redis`
3. You're done :)

### Current DB schema

![budget-tracker-schema](https://user-images.githubusercontent.com/12257282/147393125-de1c8815-023e-49d4-b337-20cfaea06552.png)
