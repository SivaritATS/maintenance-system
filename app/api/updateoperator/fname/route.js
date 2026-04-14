import { pool } from "@/server"

export async function PUT(req) {
  try {
    const { id, fname } = await req.json()

    await pool.query(
      "UPDATE operators SET fnames=? WHERE operator_id=?",
      [fname,  id]
    )

    return Response.json({ message: "Update success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}  