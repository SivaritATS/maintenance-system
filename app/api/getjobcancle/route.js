import { pool } from "@/server";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT j.*, CONCAT(o.fnames, ' ', o.lnames) as operator_name 
      FROM jobs_cancellation j 
      LEFT JOIN operators o ON j.operator = o.operator_id
    `);

    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
