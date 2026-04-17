import { pool } from "@/server"

export async function POST(req) {
  try {
     const { fname } = await req.json()
    const [rows] = await pool.query("SELECT * FROM student WHERE usernames = ?", [fname])
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}