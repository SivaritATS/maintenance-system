import { pool } from "@/server"

export async function POST(req) {
  try {
    const {
      fixs_name,
      fixs_detail,
      fixs_location,
      fixs_floor,
      fixs_status,
      reporter,
      operator,
      report_date
    } = await req.json()

    await pool.query(
      `INSERT INTO fixs 
      (fix_name,fix_detail,fix_location,fix_floor,fix_status,reporter,operator,report_date) 
      VALUES (?,?,?,?,?,?,?,?)`,
      [
        fixs_name,
        fixs_detail,
        fixs_location,
        fixs_floor,
        fixs_status,
        reporter,
        operator,
        report_date
      ]
    )

    return Response.json({ message: "Insert success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}