import { pool } from "@/server"

export async function POST(req) {
  try {
    const { fname, lname, role, password, rating, category } = await req.json()

    await pool.query(
      `INSERT INTO operators (fnames,lnames,roles,passwords,rating,category) VALUES (?,?,?,?,?,?)`,
      [fname, lname, role, password, rating, category]
    )

    return Response.json({ message: "Insert success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}