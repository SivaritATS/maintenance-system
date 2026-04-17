import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, status, operator } = await req.json();

    await pool.query(
      "UPDATE fixs SET fix_status=?, operator=? WHERE fix_id=?",
      [status, operator, id],
    );

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
