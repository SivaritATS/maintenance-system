import { pool } from "@/server";

export async function GET() {
  try {
    const [roles] = await pool.query("SELECT DISTINCT roles FROM operators");
    return Response.json({ roles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
