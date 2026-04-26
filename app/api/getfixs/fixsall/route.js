import { pool } from "@/server"

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, 
             CONCAT(o.fnames, ' ', o.lnames) as operator_name,
             CONCAT(s.fnames, ' ', s.lnames) as reporter_name,
             jc.detail as cancellationReason
      FROM fixs f 
      LEFT JOIN operators o ON f.operator = o.operator_id
      LEFT JOIN student s ON f.reporter = s.student_id
      LEFT JOIN (
        SELECT fix_no, detail 
        FROM jobs_cancellation 
        WHERE status = 'pending'
      ) jc ON f.fix_id = jc.fix_no
    `);
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}