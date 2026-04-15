import { pool } from "@/server";

export async function POST(req) {
  try {
    const { id, detail } = await req.json();

    await pool.query(
      `INSERT INTO jobs_cancellation
      (fix_no,detail) 
      VALUES (?,?)`,
      [id, detail],
    );

    return Response.json({ message: "Insert success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
