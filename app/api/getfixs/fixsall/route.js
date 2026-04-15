import { pool } from "@/server"

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM fixs")
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}