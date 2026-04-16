import { pool } from "@/server";

export async function PUT(req) {
  try {
    const { id, status } = await req.json();

    await pool.query("UPDATE jobs_cancellation SET status=? WHERE fix_no=?", [
      status,
      id,
    ]);

    return Response.json({ message: "Update success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
