import { pool } from "@/server"

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, 
             CONCAT(o.fnames, ' ', o.lnames) as operator_name,
             CONCAT(s.fnames, ' ', s.lnames) as reporter_name
      FROM fixs f 
      LEFT JOIN operators o ON f.operator = o.operator_id
      LEFT JOIN student s ON f.reporter = s.student_id
    `);
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}