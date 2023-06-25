# budget-tracker-be
Budget tracker back-end

### First run instructions

Required stack (WIP): Postgres v11, Node version specified in `.nvmrc`

1. Install dependencies
```sh
npm i
```

2. Fill configs in `./config` directory with required data (like DB name, user, pass, and e.g.) for dev/prod environments

3. Run migrations
```sh
npm run migrations
```

4. Run seeds

```sh
npm run seed
```

5. Start dev server

```sh
npm run dev
```

### If you didn't work on it for long time

1. Make sure Postres v11 is running
2. Run `nvm use`
3. That's it!

### Current DB schema

![budget-tracker-schema](https://user-images.githubusercontent.com/12257282/147393125-de1c8815-023e-49d4-b337-20cfaea06552.png)
