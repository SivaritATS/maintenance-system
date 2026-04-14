import mysql from "mysql2/promise"
export const pool = mysql.createPool({
  host: process.env.NEXT_PUBLIC_DB_SERVER,
  user: process.env.NEXT_PUBLIC_DB_USERNAME,
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  database: process.env.NEXT_PUBLIC_DB_NAME,
  port: process.env.NEXT_PUBLIC_DB_PORT,
  ssl: { rejectUnauthorized: true }
})