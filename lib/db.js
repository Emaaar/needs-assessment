import mysql from "mysql2/promise"

export async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "formbuilder",
    })
    console.log("Database connection successful")
    return connection
  } catch (error) {
    console.error("Database connection failed:", error.message)
    throw error
  }
}

