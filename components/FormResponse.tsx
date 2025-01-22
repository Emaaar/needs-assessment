"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { FormData, Question, Option, FormSubmission } from "@/types/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface FormResponseProps {
  form: FormData
  formId: string
}

export function FormResponse({ form, formId }: FormResponseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const submission: FormSubmission = {
      formId: Number(formId),
      publish_token: form.publish_token || '', // Add the publish token from the form data
      answers: [],
    }

    form.questions.forEach((question) => {
      if (question.type === "checkbox") {
        const values = formData.getAll(`question_${question.id}`)
        submission.answers.push({
          questionId: question.id,
          value: values.map((v) => v.toString()),
        })
      } else if (question.type === "multiple-choice") {
        const value = formData.get(`question_${question.id}`)
        if (value) {
          submission.answers.push({
            questionId: question.id,
            value: [value.toString()],
          })
        }
      } else {
        const value = formData.get(`question_${question.id}`)
        if (typeof value === "string") {
          submission.answers.push({
            questionId: question.id,
            value: value,
          })
        }
      }
    })

    try {
      const response = await fetch(`/api/forms/${formId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit form")
      }

      toast({
        title: "Success",
        description: "Your response has been submitted successfully.",
      })

      router.push("/forms")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "There was a problem submitting your response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>{form.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {form.questions.map((question: Question) => (
              <div key={question.id} className="mb-4">
                <label className="block font-medium mb-2">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.type === "short-answer" && (
                  <Input type="text" name={`question_${question.id}`} required={question.required} className="w-full" />
                )}
                {question.type === "paragraph" && (
                  <Textarea name={`question_${question.id}`} required={question.required} className="w-full" rows={4} />
                )}
                {(question.type === "multiple-choice" || question.type === "checkbox") && (
                  <div className="space-y-2">
                    {question.options?.map((option: Option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type={question.type === "multiple-choice" ? "radio" : "checkbox"}
                          id={`option_${option.id}`}
                          name={`question_${question.id}`}
                          value={option.id}
                          required={question.required && question.type === "multiple-choice"}
                          className="mr-2"
                        />
                        <label htmlFor={`option_${option.id}`}>{option.option_text}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}