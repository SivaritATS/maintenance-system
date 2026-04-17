import { pool } from "@/server"

export async function POST(req) {
  try {
     const { id } = await req.json()
    const [rows] = await pool.query("SELECT * FROM student WHERE student_id = ?", [id])
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}