const express = require("express")
const mysql = require("mysql2/promise")
const app = express()
app.use(express.json())
require("dotenv").config({ path: ".env.production" })

const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 4000,
  ssl: { rejectUnauthorized: true }
})

app.get("/getoperator", async (request, response) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM operators`)
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get("/getstudent", async (request, response) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM student`)
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get("/gettransaction", async (request, response) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM Transactions`)
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get("/fixs", async (request, response) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM fixs`)
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/getoperator", async (request, response) => {
  try {
    const { id } = request.body
    if (!id) {
      return response.status(400).json({ error: "id is required" })
    }
    const [rows] = await pool.query(`SELECT * FROM operators WHERE operator_id = ?`, [id])
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/gettransaction", async (request, response) => {
  try {
    const { id } = request.body
    if (!id) {
      return response.status(400).json({ error: "id is required" })
    }
    const [rows] = await pool.query(`SELECT * FROM Transactions WHERE id = ?`, [id])
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/getstudent", async (request, response) => {
  try {
    const { id } = request.body
    if (!id) {
      return response.status(400).json({ error: "id is required" })
    }
    const [rows] = await pool.query(`SELECT * FROM student WHERE student_id = ?`, [id])
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/getfixs", async (request, response) => {
  try {
    const { id } = request.body
    if (!id) {
      return response.status(400).json({ error: "id is required" })
    }
    const [rows] = await pool.query(`SELECT * FROM fixs WHERE fix_id = ?`, [id])
    response.json(rows)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/addstudent", async (request, response) => {
  try {
    const { fname, lname, password } = request.body
    await pool.query(`INSERT INTO student (fnames,lnames,passwords) VALUES (?,?,?)`, [fname, lname, password])
    response.status(200).json({ message: "Insert success" })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/addtransaction", async (request, response) => {
  try {
    const { operator_id, credit_received } = request.body
    await pool.query(`INSERT INTO Transactions (operator_id,credit_received) VALUES (?,?)`, [operator_id, credit_received])
    response.status(200).json({ message: "Insert success" })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/addoperator", async (request, response) => {
  try {
    const { fname, lname, role, password, rating, category } = request.body
    await pool.query(
      `INSERT INTO operators (fnames,lnames,roles,passwords,rating,category) VALUES (?,?,?,?,?,?)`,
      [fname, lname, role, password, rating, category]
    )
    response.status(200).json({ message: "Insert success" })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post("/addfixs", async (request, response) => {
  try {
    const { fixs_name, fixs_detail, fixs_location, fixs_floor, fixs_status, reporter, operator, report_date } = request.body
    await pool.query(
      `INSERT INTO fixs (fix_name,fix_detail,fix_location,fix_floor,fix_status,reporter,operator,report_date) VALUES (?,?,?,?,?,?,?,?)`,
      [fixs_name, fixs_detail, fixs_location, fixs_floor, fixs_status, reporter, operator, report_date]
    )
    response.status(200).json({ message: "Insert success" })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.put("/updatestatus", async (request, response) => {
  try {
    const { id, status, finish_date } = request.body
    await pool.query(`UPDATE fixs SET fix_status=?, finish_date=? WHERE fix_id=?`, [status, finish_date, id])
    response.status(200).json({ message: "Insert success" })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.listen(3000, () => {
  console.log("Listening on port 3000...")
})