import { pool } from "@/server"
import { request } from "http"

export async function POST(req) {
  try {
    const {id} = await req.json()
    let [rows] = await pool.query("SELECT * FROM operators WHERE operator_id = ?", [id])
    if (rows && rows.length > 0) {
      let op = rows[0];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const todayStr = currentDate.toISOString().split('T')[0];

      if (op.last_score_reset) {
        const resetDate = new Date(op.last_score_reset);
        if (resetDate.getMonth() !== currentMonth || resetDate.getFullYear() !== currentYear) {
          await pool.query("UPDATE operators SET score = 100, last_score_reset = ? WHERE operator_id = ?", [todayStr, op.operator_id]);
          op.score = 100;
          op.last_score_reset = todayStr;
        }
      } else {
         await pool.query("UPDATE operators SET last_score_reset = ? WHERE operator_id = ?", [todayStr, op.operator_id]);
         op.last_score_reset = todayStr;
      }
      rows[0] = op;
    }
    return Response.json(rows)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}