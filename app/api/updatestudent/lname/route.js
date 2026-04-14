import { pool } from "@/server"

export async function PUT(req) {
  try {
    const { id, lname } = await req.json()

    await pool.query(
      "UPDATE student SET lnames=? WHERE student_id=?",
      [lname,  id]
    )

    return Response.json({ message: "Update success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}  