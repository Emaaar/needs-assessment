import mysql from "mysql2/promise"
import type { Pool, PoolConnection } from "mysql2/promise"

// Create a connection pool
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "formbuilder",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// Function to get a connection from the pool
export async function getConnection(): Promise<PoolConnection> {
  try {
    const connection = await pool.getConnection()
    return connection
  } catch (error) {
    console.error("Error getting connection from pool:", error)
    throw error
  }
}

// Function to create a new connection (for specific cases where needed)
export async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "formbuilder",
    })
    return connection
  } catch (error) {
    console.error("Error creating new connection:", error)
    throw error
  }
}

// Export the pool for direct use
export const db = pool

// Helper function to execute queries with automatic connection handling
export async function executeQuery<T>(query: string, params?: any[]): Promise<T> {
  let connection: PoolConnection | null = null
  try {
    connection = await getConnection()
    const [results] = await connection.execute(query, params)
    return results as T
  } catch (error) {
    console.error("Error executing query:", error)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

