import { pool } from "@/server"
import { request } from "http"

export async function POST(req) {
  try {
    const {id} = await req.json()
    const [rows] = await pool.query("SELECT * FROM operators WHERE operator_id = ?", [id])
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}