"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Question {
  id: number
  title: string
  type: "short-answer" | "paragraph" | "multiple-choice" | "checkbox"
  required: boolean
  options?: { id: number; option_text: string }[]
}

interface FormResponseProps {
  formId: string
  publishToken: string
  questions: Question[]
}

export function FormResponse({ formId, publishToken, questions }: FormResponseProps) {
  const [responses, setResponses] = useState<{ [key: number]: string | string[] }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/forms/${formId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publish_token: publishToken,
          responses: questions.map((q) => ({
            questionId: q.id,
            answer: responses[q.id] || "",
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit response")
      }

      toast({
        title: "Response submitted successfully",
        description: "Thank you for your feedback!",
      })

      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting response:", error)
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (questionId: number, value: string | string[]) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle>{question.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {question.type === "short-answer" && (
              <Input
                type="text"
                value={(responses[question.id] as string) || ""}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                required={question.required}
              />
            )}
            {question.type === "paragraph" && (
              <Textarea
                value={(responses[question.id] as string) || ""}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                required={question.required}
              />
            )}
            {question.type === "multiple-choice" && question.options && (
              <RadioGroup onValueChange={(value) => handleInputChange(question.id, value)} required={question.required}>
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`}>{option.option_text}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {question.type === "checkbox" && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      onCheckedChange={(checked) => {
                        const currentValue = (responses[question.id] as string[]) || []
                        const newValue = checked
                          ? [...currentValue, option.id.toString()]
                          : currentValue.filter((id) => id !== option.id.toString())
                        handleInputChange(question.id, newValue)
                      }}
                    />
                    <Label htmlFor={`option-${option.id}`}>{option.option_text}</Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Response"}
      </Button>
    </form>
  )
}

