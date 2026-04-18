import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, score } = await req.json();

    await pool.query(`UPDATE operators SET score = ? WHERE operator_id=?`, [
      score,
      id,
    ]);

    return Response.json({ message: "update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
