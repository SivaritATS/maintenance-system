import { pool } from "@/server";

export async function POST(req) {
  try {
    const { id, image } = await req.json();

    await pool.query("UPDATE fixs SET image=? WHERE fix_id=?", [image, id]);

    return Response.json({ message: "ok" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
