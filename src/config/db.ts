import {createPool} from "mysql2/promise";

require('dotenv').config();

const db = createPool({
  host: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT!),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

export default db;

