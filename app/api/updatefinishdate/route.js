import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, date } = await req.json();

    await pool.query("UPDATE fixs SET finish_date=? WHERE fix_id=?", [
      date,
      id,
    ]);

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
