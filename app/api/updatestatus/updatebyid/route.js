import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, status, approved_by } = await req.json();

    if (approved_by) {
      await pool.query("UPDATE fixs SET fix_status=?, approved_by=? WHERE fix_id=?", [
        status,
        approved_by,
        id,
      ]);
    } else {
      await pool.query("UPDATE fixs SET fix_status=? WHERE fix_id=?", [
        status,
        id,
      ]);
    }

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
