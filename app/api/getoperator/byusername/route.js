import { pool } from "@/server";
import { request } from "http";

export async function POST(req) {
  try {
    const { username } = await req.json();
    const [rows] = await pool.query(
      "SELECT * FROM operators WHERE usernames = ?",
      [username],
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
