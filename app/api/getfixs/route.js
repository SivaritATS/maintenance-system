import { pool } from "@/server"

export async function POST(req) {
  try {
    const { id } = await req.json()

    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 })
    }

    const [rows] = await pool.query(
      "SELECT * FROM fixs WHERE fix_id = ?",
      [id]
    )

    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}