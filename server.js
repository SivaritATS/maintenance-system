import mysql from "mysql2/promise"
export const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 4000,
  ssl: { rejectUnauthorized: true }
})