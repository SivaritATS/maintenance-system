import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, credit } = await req.json();

    await pool.query("UPDATE fixs SET credit=? WHERE fix_id=?", [credit, id]);

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
