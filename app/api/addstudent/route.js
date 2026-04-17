import { pool } from "@/server"

export async function POST(req) {
  try {
    const { fname, lname, password } = await req.json()

    await pool.query(
      "INSERT INTO student (fnames,lnames,passwords) VALUES (?,?,?)",
      [fname, lname, password]
    )

    return Response.json({ message: "Insert success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}