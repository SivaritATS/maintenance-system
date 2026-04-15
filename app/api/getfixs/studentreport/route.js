import { pool } from "@/server"

export async function POST(req) {
  try {
     const { id } = await req.json()
    const [rows] = await pool.query("SELECT * FROM fixs WHERE reporter = ?", [id])
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}