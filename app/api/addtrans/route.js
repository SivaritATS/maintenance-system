import { pool } from "@/server";

export async function POST(req) {
  try {
    const { operator_id, credit_received } = await req.json();

    await pool.query(
      "INSERT INTO Transactions (operator_id,credit_received) VALUES (?,?)",
      [operator_id, credit_received],
    );

    return Response.json({ message: "Insert success" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
