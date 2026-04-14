import { pool } from "@/server"

export async function POST(req) {
  try {
    const {
      fixs_name,
      fixs_detail,
      fixs_location,
      fixs_status,
      reporter,
      operator,
      report_date,
      category,
      finish_date,
      credit
    } = await req.json()

    await pool.query(
      `INSERT INTO fixs 
      (fix_name,fix_detail,fix_location,fix_status,reporter,operator,report_date,category,finish_date,credit) 
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        fixs_name,
        fixs_detail,
        fixs_location,
        fixs_status,
        reporter,
        operator,
        report_date,
        category,
        finish_date, 
        credit
      ]
    )

    return Response.json({ message: "Insert success" })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}