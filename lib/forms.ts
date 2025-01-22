import { createConnection } from "@/lib/db"

interface Question {
  id: number
  title: string
  type: string
  required: boolean
}

export async function getFormQuestions(formId: string, publishToken: string): Promise<Question[]> {
  let connection
  try {
    connection = await createConnection()

    const [formResult] = await connection.execute(
      "SELECT id FROM forms WHERE id = ? AND publish_token = ? AND published = TRUE",
      [formId, publishToken],
    )

    if ((formResult as any[]).length === 0) {
      console.error("Invalid form or publish token")
      return []
    }

    const [questions] = await connection.execute("SELECT id, title, type, required FROM questions WHERE form_id = ?", [
      formId,
    ])

    return questions as Question[]
  } catch (error) {
    console.error("Error fetching form questions:", error)
    return []
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

