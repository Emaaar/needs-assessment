import { NextResponse } from "next/server"
import { createConnection } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { formId: string } }) {
  let connection
  try {
    const formId = params.formId
    const publishToken = Math.random().toString(36).substring(2, 15)

    connection = await createConnection()

    // Start a transaction
    await connection.beginTransaction()

    // Update the form status and publish token
    const [updateResult] = await connection.execute(
      "UPDATE forms SET published = TRUE, publish_token = ? WHERE id = ?",
      [publishToken, formId],
    )

    if ((updateResult as any).affectedRows === 0) {
      throw new Error("Form not found or already published")
    }

    // Fetch the questions associated with the form
    const [questions] = await connection.execute("SELECT id, title, type, required FROM questions WHERE form_id = ?", [
      formId,
    ])

    // Commit the transaction
    await connection.commit()

    const publishedLink = `${process.env.NEXT_PUBLIC_BASE_URL}/form/${formId}?token=${publishToken}`

    //This section needs to be added to handle the form response.  The existing code only publishes the form.
    const { formResponse } = await request.json()
    const responseId = Math.random().toString(36).substring(2, 15)

    // Start a transaction for response insertion
    await connection.beginTransaction()

    // Insert the response
    await connection.execute("INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)", [
      responseId,
      formId,
      new Date(),
    ])

    // Update the answer processing logic
    for (const answer of formResponse.answers) {
      if ("answer_text" in answer) {
        // Handle text answers
        await connection.execute("INSERT INTO answer_texts (response_id, question_id, answer_text) VALUES (?, ?, ?)", [
          responseId,
          answer.question_id,
          answer.answer_text,
        ])
      } else if ("option_id" in answer) {
        // Handle option answers
        const optionIds = Array.isArray(answer.option_id) ? answer.option_id : [answer.option_id]
        for (const optionId of optionIds) {
          await connection.execute(
            "INSERT INTO answer_options (response_id, question_id, option_id) VALUES (?, ?, ?)",
            [responseId, answer.question_id, optionId],
          )
        }
      }
    }

    await connection.commit()

    return NextResponse.json({
      publishedLink,
      publish_token: publishToken,
      questions,
      message: "Form published successfully",
      responseId,
    })
  } catch (error) {
    console.error("Error publishing form:", error)
    if (connection) {
      await connection.rollback()
    }
    return NextResponse.json({ message: "Error publishing form: " + (error as Error).message }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

