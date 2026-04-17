import { pool } from "@/server";

export async function POST(req) {
  try {
    const { id, detail, operator,status } = await req.json();

    await pool.query(
      `INSERT INTO jobs_cancellation
      (fix_no,detail,operator,status) 
      VALUES (?,?,?,?)`,
      [id, detail, operator,status],
    );

    return Response.json({ message: "Insert success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
