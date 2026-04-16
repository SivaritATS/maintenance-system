import { pool } from "@/server";

export async function POST(req) {
  try {
    const { operator, detail, earn, fix_id } = await req.json();

    await pool.query(
      `INSERT INTO score(operator,detail,earn,fix_id) VALUES (?,?,?,?)`,
      [operator, detail, earn, fix_id],
    );

    return Response.json({ message: "Insert success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
