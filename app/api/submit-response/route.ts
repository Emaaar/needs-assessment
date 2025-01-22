import { NextResponse } from 'next/server';
import { createConnection } from '@/lib/db.js';
import { FormResponse, TextAnswer, OptionAnswer } from '@/types/form';

export async function POST(request: Request) {
  const formResponse: FormResponse = await request.json();

  try {
    const connection = await createConnection();

    // Insert response
    const [responseResult] = await connection.execute(
      'INSERT INTO responses (form_id) VALUES (?)',
      [formResponse.form_id]
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

    await connection.end();

    return NextResponse.json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ message: 'Error submitting response' }, { status: 500 });
  }
}
