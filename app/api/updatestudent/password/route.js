import { pool } from "@/server"

export async function PUT(req) {
  try {
    const { id, password } = await req.json()

    await pool.query(
      "UPDATE student SET passwords=? WHERE student_id=?",
      [password, id]
    )

    return Response.json({ message: "Update success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}  