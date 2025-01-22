import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface TextAnswer extends RowDataPacket {
  id: number;
  response_id: number;
  question_id: number;
  answer_text: string;
}

interface OptionAnswer extends RowDataPacket {
  id: number;
  response_id: number;
  question_id: number;
  option_id: number;
}

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  try {
    const formId = Number.parseInt(params.formId);

    const connection = await createConnection(); // Ensure createConnection creates a connection instance
    if (!connection) throw new Error("Database connection failed.");

    // Get form details
    const [formRows] = await connection.execute<RowDataPacket[]>("SELECT * FROM forms WHERE id = ?", [formId]);
    const form = formRows[0];

    if (!form) {
      return NextResponse.json({ success: false, message: "Form not found" }, { status: 404 });
    }

    // Get responses
    const [responseRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM responses WHERE form_id = ?",
      [formId]
    );
    const responses = responseRows;

    // Get answers for each response
    for (const response of responses) {
      // Get text answers
      const [textAnswerRows] = await connection.execute<TextAnswer[]>(
        `SELECT * FROM answers 
         WHERE response_id = ? AND answer_text IS NOT NULL`,
        [response.id]
      );

      // Get option answers
      const [optionAnswerRows] = await connection.execute<OptionAnswer[]>(
        `SELECT * FROM answers 
         WHERE response_id = ? AND option_id IS NOT NULL`,
        [response.id]
      );

      // Combine answers
      response.answers = [
        ...(Array.isArray(textAnswerRows) ? textAnswerRows : []),
        ...(Array.isArray(optionAnswerRows) ? optionAnswerRows : []),
      ];
    }

    // Calculate analytics
    const analytics = {
      totalResponses: responses.length,
      questionAnalytics: {} as { [key: number]: any },
    };

    // Get all questions
    const [questionRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM questions WHERE form_id = ?",
      [formId]
    );
    const questions = questionRows;

    for (const question of questions) {
      const questionId = question.id;
      const analytics_data = {
        totalResponses: 0,
        shortAnswers: [] as string[],
        optionCounts: {} as { [key: number]: number },
      };

      // Process answers for this question
      for (const response of responses) {
        const answer = response.answers.find((a: any) => a.question_id === questionId);
        if (answer) {
          analytics_data.totalResponses++;
          if (answer.answer_text) {
            analytics_data.shortAnswers.push(answer.answer_text);
          }
          if (answer.option_id) {
            analytics_data.optionCounts[answer.option_id] =
              (analytics_data.optionCounts[answer.option_id] || 0) + 1;
          }
        }
      }

      analytics.questionAnalytics[questionId] = analytics_data;
    }

    return NextResponse.json({
      success: true,
      form,
      responses,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch form", error: (error as Error).message },
      { status: 500 }
    );
  }
}
