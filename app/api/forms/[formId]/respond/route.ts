import { NextResponse } from 'next/server';
import { createConnection } from '@/lib/db.js';
import { FormResponse, TextAnswer, OptionAnswer } from '@/types/form';

export async function POST(request: Request, { params }: { params: { formId: string } }) {
  let connection;
  try {
    const formId = params.formId;
    const formResponse: FormResponse = await request.json();
    
    connection = await createConnection();

    // Check if form exists and is published
    const [formResult] = await connection.execute(
      'SELECT published, publish_token FROM forms WHERE id = ?',
      [formId]
    );

    const forms = formResult as any[];
    if (forms.length === 0) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (!forms[0].published) {
      return NextResponse.json({ message: "This form is not published" }, { status: 403 });
    }

    // Verify publish token if provided in the response
    if (formResponse.publish_token !== forms[0].publish_token) {
      return NextResponse.json({ message: "Invalid publish token" }, { status: 403 });
    }

    // Insert response
    const [responseResult] = await connection.execute(
      'INSERT INTO responses (form_id) VALUES (?)',
      [formId]
    );

    const responseId = (responseResult as any).insertId;

    // Insert answers
    for (const answer of formResponse.answers) {
      if ((answer as TextAnswer).answer_text) {
        // Handle text-based answers
        const textAnswer = answer as TextAnswer;
        await connection.execute(
          'INSERT INTO answer_texts (response_id, question_id, answer_text) VALUES (?, ?, ?)',
          [responseId, textAnswer.question_id, textAnswer.answer_text]
        );
      } else if (Array.isArray((answer as OptionAnswer).option_id)) {
        // Handle option-based answers
        const optionAnswer = answer as OptionAnswer;
        for (const optionId of optionAnswer.option_id) {
          await connection.execute(
            'INSERT INTO answer_options (response_id, question_id, option_id) VALUES (?, ?, ?)',
            [responseId, optionAnswer.question_id, optionId]
          );
        }
      }
    }

    return NextResponse.json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ message: 'Error submitting response' }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}