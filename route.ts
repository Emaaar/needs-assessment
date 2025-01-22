import { NextResponse } from 'next/server';
import { createConnection } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { formId: string } }
) {
  try {
    const connection = await createConnection();

    // Generate a unique publish token
    const publishToken = Math.random().toString(36).substring(2, 15);

    // Update the form with the publish token
    await connection.execute(
      'UPDATE forms SET published = TRUE, publish_token = ? WHERE id = ?',
      [publishToken, params.formId]
    );

    await connection.end();

    const publishedLink = `${process.env.NEXT_PUBLIC_BASE_URL}/forms/${params.formId}/respond/${publishToken}`;

    return NextResponse.json({ publishedLink, message: 'Form published successfully' });
  } catch (error) {
    console.error('Error publishing form:', error);
    return NextResponse.json({ message: 'Error publishing form' }, { status: 500 });
  }
}

