  import { NextResponse } from "next/server"
  import { createConnection } from "@/lib/db"

  export async function POST(request: Request) {
    let connection
    try {
      const { title, description, partner_name, expected_participants, questions } = await request.json()

      connection = await createConnection()

      // Start a transaction
      await connection.beginTransaction()

      // Insert the form
      const [formResult] = await connection.execute(
        "INSERT INTO forms (title, description, partner_name, expected_participants) VALUES (?, ?, ?, ?)",
        [title, description, partner_name, expected_participants],
      )
      const formId = (formResult as any).insertId

      // Insert questions
      for (const question of questions) {
        const [questionResult] = await connection.execute(
          "INSERT INTO questions (form_id, title, type, required) VALUES (?, ?, ?, ?)",
          [formId, question.title, question.type, question.required],
        )
        const questionId = (questionResult as any).insertId

        // Insert options if present
        if (question.options) {
          for (const option of question.options) {
            await connection.execute("INSERT INTO options (question_id, option_text) VALUES (?, ?)", [
              questionId,
              option.option_text,
            ])
          }
        }
      }

      // Commit the transaction
      await connection.commit()

      return NextResponse.json({ id: formId, message: "Form created successfully" })
    } catch (error) {
      console.error("Error creating form:", error)
      if (connection) {
        await connection.rollback()
      }
      return NextResponse.json({ message: "Error creating form: " + (error as Error).message }, { status: 500 })
    } finally {
      if (connection) {
        await connection.end()
      }
    }
  }

