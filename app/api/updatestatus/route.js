import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, status, finish_date, operator } = await req.json();

    await pool.query(
      "UPDATE fixs SET fix_status=?, finish_date=?,operator=? WHERE fix_id=?",
      [status, finish_date, operator, id],
    );

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
