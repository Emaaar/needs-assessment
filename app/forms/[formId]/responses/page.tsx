"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import type { FormData, Question, FormSubmission } from "@/types/form"

function RespondToForm({
  params,
}: {
  params: { formId: string; publishToken: string }
}) {
  const [form, setForm] = React.useState<FormData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  React.useEffect(() => {
    async function fetchForm() {
      try {
        if (!params.formId || !params.publishToken) {
          throw new Error("Missing form ID or publish token")
        }

        const response = await fetch(
          `/api/forms/${encodeURIComponent(params.formId)}/publish?token=${encodeURIComponent(params.publishToken)}`,
          {
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store'
          }
        )

        if (response.status === 404) {
          setError("Form not found or not published")
          return
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data || !data.title || !Array.isArray(data.questions)) {
          throw new Error("Invalid form data received")
        }

        setForm(data)
        setError(null)
      } catch (error) {
        console.error("Error fetching form:", error)
        setError(error instanceof Error ? error.message : "Failed to load form")
        toast({
          title: "Error",
          description: "Failed to load form. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchForm()
  }, [params.formId, params.publishToken, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formElement = e.currentTarget as HTMLFormElement
    const formData = new FormData(formElement)
    
    const answers: { questionId: number; value: string | string[] }[] = []
    
    // Process form data
    form?.questions.forEach((question) => {
      const questionId = question.id.toString()
      
      if (question.type === "checkbox") {
        const values = formData.getAll(`${questionId}[]`).map(String)
        if (values.length > 0) {
          answers.push({
            questionId: parseInt(questionId),
            value: values
          })
        }
      } else {
        const value = formData.get(questionId)
        if (value) {
          answers.push({
            questionId: parseInt(questionId),
            value: value.toString()
          })
        }
      }
    })

    const submission: FormSubmission = {
      formId: parseInt(params.formId),
      publish_token: params.publishToken,
      answers
    }

    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(params.formId)}/respond`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Response submitted successfully!",
      })
      
      formElement.reset()
    } catch (error) {
      console.error("Error submitting response:", error)
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Loading form...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{error || "Form not found or not published."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && <CardDescription>{form.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {form.questions.map((question: Question) => (
              <div key={question.id} className="space-y-3">
                <label htmlFor={question.id.toString()} className="block text-sm font-medium">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.type === "short-answer" && (
                  <Input
                    type="text"
                    id={question.id.toString()}
                    name={question.id.toString()}
                    required={question.required}
                    className="w-full"
                  />
                )}
                {question.type === "paragraph" && (
                  <Textarea 
                    id={question.id.toString()}
                    name={question.id.toString()}
                    required={question.required}
                    className="w-full min-h-[100px]"
                  />
                )}
                {question.type === "multiple-choice" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id={`${question.id}-${option.id}`}
                          name={question.id.toString()}
                          value={option.id}
                          required={question.required}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`${question.id}-${option.id}`}>{option.option_text}</label>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === "checkbox" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`${question.id}-${option.id}`}
                          name={`${question.id}[]`}
                          value={option.id}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`${question.id}-${option.id}`}>{option.option_text}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
          <div className="p-6 flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default RespondToForm