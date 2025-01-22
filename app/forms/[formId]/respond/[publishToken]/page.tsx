import { createConnection } from '@/lib/db.js';
import { FormData, Question } from '@/types/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

async function getPublishedForm(formId: string, publishToken: string): Promise<FormData | null> {
  const connection = await createConnection();

  const [formRows] = await connection.execute(
    'SELECT * FROM forms WHERE id = ? AND published = TRUE AND publish_token = ?',
    [formId, publishToken]
  );

  if ((formRows as any[]).length === 0) {
    return null;
  }

  const form = (formRows as any[])[0];

  const [questionRows] = await connection.execute(
    'SELECT * FROM questions WHERE form_id = ?',
    [formId]
  );

  const questions = await Promise.all((questionRows as any[]).map(async (question) => {
    if (question.type === 'multiple-choice' || question.type === 'checkbox') {
      const [optionRows] = await connection.execute(
        'SELECT * FROM options WHERE question_id = ?',
        [question.id]
      );
      question.options = optionRows;
    }
    return question;
  }));

  await connection.end();

  return {
    ...form,
    questions,
  };
}

export default async function RespondToForm({ params }: { params: { formId: string, publishToken: string } }) {
  const form = await getPublishedForm(params.formId, params.publishToken);

  if (!form) {
    return <div>Form not found or not published.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={`/api/forms/${params.formId}/respond`} method="POST">
            {form.questions.map((question: Question) => (
              <div key={question.id} className="mb-4">
                <label className="block font-medium mb-2">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.type === 'short-answer' && (
                  <Input
                    type="text"
                    name={`question_${question.id}`}
                    required={question.required}
                    className="w-full"
                  />
                )}
                {question.type === 'paragraph' && (
                  <Textarea
                    name={`question_${question.id}`}
                    required={question.required}
                    className="w-full"
                    rows={4}
                  />
                )}
                {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                  <div className="space-y-2">
                    {question.options?.map((option: any) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type={question.type === 'multiple-choice' ? 'radio' : 'checkbox'}
                          id={`option_${option.id}`}
                          name={`question_${question.id}`}
                          value={option.id}
                          required={question.required && question.type === 'multiple-choice'}
                          className="mr-2"
                        />
                        <label htmlFor={`option_${option.id}`}>{option.option_text}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button type="submit">Submit Response</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

