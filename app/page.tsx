"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Plus, Copy, Save, Send } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import type {
  FormData,
  Question,
  Option,
  FormSubmission,
  FormWithResponsesAndAnalytics,
  TextAnswer,
  OptionAnswer,
} from "@/types/form"

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    id: undefined,
    title: "Untitled Form",
    description: "",
    partner_name: "",
    expected_participants: 0,
    questions: [],
    published: false,
  })

  const [activeTab, setActiveTab] = useState("builder")
  const [publishedLink, setPublishedLink] = useState<string | null>(null)

  const handleFormUpdate = (updatedForm: FormData) => {
    setFormData(updatedForm)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Needs Assessment</h1>
          <p className="text-gray-600 mt-2">Create and manage assessment forms easily</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid grid-cols-4 gap-4">
                  {["builder", "response", "responses", "analytics"].map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="text-sm capitalize">
                      {tab.replace("_", " ")}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="builder">
                  <FormBuilder
                    initialData={formData}
                    onFormUpdate={handleFormUpdate}
                    onPublish={setPublishedLink}
                    publishedLink={publishedLink}
                  />
                </TabsContent>
                <TabsContent value="response">
                  <FormResponse form={formData} formId={formData.id?.toString() || ""} preview />
                </TabsContent>
                <TabsContent value="responses">
                  <ResponseList formWithResponses={formData as FormWithResponsesAndAnalytics} />
                </TabsContent>
                <TabsContent value="analytics">
                  <AnalyticsView formData={formData as FormWithResponsesAndAnalytics} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FormBuilder({
  initialData,
  onFormUpdate,
  onPublish,
  publishedLink,
}: {
  initialData: FormData
  onFormUpdate: (updatedForm: FormData) => void
  onPublish: (link: string) => void
  publishedLink: string | null
}) {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updatedForm = { ...prev, [field]: value }
      return updatedForm
    })
  }

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setFormData((prev) => {
      const updatedQuestions = prev.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
      const updatedForm = { ...prev, questions: updatedQuestions }
      return updatedForm
    })
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      form_id: formData.id || 0,
      title: "",
      type: "short-answer",
      required: false,
      options: [],
    }
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const deleteQuestion = (questionId: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to save form")

      const result = await response.json()
      const updatedForm = { ...formData, id: result.id }
      setFormData(updatedForm)
      onFormUpdate(updatedForm)
      toast({
        title: "Form Saved",
        description: "Your form has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const publishForm = async () => {
    if (!formData.id) {
      toast({
        title: "Error",
        description: "Please save the form before publishing.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch(`/api/forms/${formData.id}/publish`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to publish form")

      const data = await response.json()
      const publishedLink = data.publishedLink
      const updatedForm = {
        ...formData,
        published: true,
        publish_token: data.publish_token,
      }
      setFormData(updatedForm)
      onFormUpdate(updatedForm);
onPublish(publishedLink);
toast({
  title: "Success",
  description: "Form published successfully!",
});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Form Title
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="partner_name" className="block text-sm font-medium text-gray-700">
            Partner Name
          </label>
          <Input
            id="partner_name"
            value={formData.partner_name}
            onChange={(e) => handleInputChange("partner_name", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="expected_participants" className="block text-sm font-medium text-gray-700">
            Expected Participants
          </label>
          <Input
            id="expected_participants"
            type="number"
            value={formData.expected_participants || ""}
            onChange={(e) => {
              const value = e.target.value
              handleInputChange("expected_participants", value === "" ? "" : Number(value))
            }}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Questions</h3>
        {formData.questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={question.title}
                    onChange={(e) => handleQuestionUpdate({ ...question, title: e.target.value })}
                    placeholder="Question title"
                    className="flex-grow mr-2"
                  />
                  <Button type="button" variant="destructive" size="sm" onClick={() => deleteQuestion(question.id)}>
                    Delete
                  </Button>
                </div>
                <Select
                  value={question.type}
                  onValueChange={(value) => handleQuestionUpdate({ ...question, type: value as Question["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
                {(question.type === "multiple-choice" || question.type === "checkbox") && (
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Input
                          value={option.option_text}
                          onChange={(e) => {
                            const updatedOptions = [...(question.options || [])]
                            updatedOptions[optionIndex] = { ...option, option_text: e.target.value }
                            handleQuestionUpdate({ ...question, options: updatedOptions })
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const updatedOptions = question.options?.filter((_, i) => i !== optionIndex) || []
                            handleQuestionUpdate({ ...question, options: updatedOptions })
                          }}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span className="sr-only">Remove option</span>
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newOption: Option = {
                          id: Date.now(),
                          question_id: question.id,
                          option_text: "",
                        }
                        handleQuestionUpdate({
                          ...question,
                          options: [...(question.options || []), newOption],
                        })
                      }}
                    >
                      Add Option
                    </Button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => handleQuestionUpdate({ ...question, required: checked })}
                  />
                  <label htmlFor={`required-${question.id}`} className="text-sm">
                    Required
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={addQuestion} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Form"}
        </Button>
        <Button
          type="button"
          onClick={publishForm}
          disabled={!formData.id || formData.published || isPublishing}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          {isPublishing ? "Publishing..." : formData.published ? "Published" : "Publish"}
        </Button>
      </div>

      {(formData.published || publishedLink) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Published Link</label>
              <div className="flex items-center space-x-2">
                <Input value={publishedLink || ""} readOnly />
                <Button
                  onClick={() => {
                    if (publishedLink) {
                      navigator.clipboard.writeText(publishedLink)
                      toast({
                        title: "Copied",
                        description: "Link copied to clipboard",
                      })
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}

function FormResponse({ form, formId, preview }: { form: FormData; formId: string; preview?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (preview) {
      toast({
        title: "Preview Mode",
        description: "This is a preview. Responses will not be submitted.",
      })
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const submission: FormSubmission = {
      formId: Number(formId),
      publish_token: form.publish_token || "",
      answers: [],
    }

    form.questions.forEach((question) => {
      const questionId = question.id

      if (question.type === "short-answer" || question.type === "paragraph") {
        const answer = formData.get(`question_${questionId}`) as string
        if (answer) {
          submission.answers.push({
            questionId: questionId,
            value: answer,
          })
        }
      } else if (question.type === "multiple-choice") {
        const answer = formData.get(`question_${questionId}`) as string
        if (answer) {
          submission.answers.push({
            questionId: questionId,
            value: answer,
          })
        }
      } else if (question.type === "checkbox") {
        const checkboxAnswers = formData.getAll(`question_${questionId}`) as string[]
        if (checkboxAnswers.length > 0) {
          submission.answers.push({
            questionId: questionId,
            value: checkboxAnswers,
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
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "There was a problem submitting your response.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        <CardDescription>{form.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {preview && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>You are in preview mode. Responses will not be submitted.</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((question: Question) => (
            <div key={question.id} className="space-y-2">
              <label className="block font-medium">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {(question.type === "short-answer" || question.type === "paragraph") && (
                <Input
                  type="text"
                  name={`question_${question.id}`}
                  disabled={preview}
                  required={question.required}
                  className={question.type === "paragraph" ? "min-h-[100px]" : ""}
                  {...(question.type === "paragraph" && { as: "textarea" })}
                />
              )}

              {question.type === "multiple-choice" && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`option_${option.id}`}
                        name={`question_${question.id}`}
                        value={option.id}
                        disabled={preview}
                        required={question.required}
                        className="form-radio"
                      />
                      <label htmlFor={`option_${option.id}`}>{option.option_text}</label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "checkbox" && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`option_${option.id}`}
                        name={`question_${question.id}`}
                        value={option.id}
                        disabled={preview}
                        className="form-checkbox"
                      />
                      <label htmlFor={`option_${option.id}`}>{option.option_text}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button type="submit" disabled={isSubmitting || preview} className="w-full">
            {isSubmitting ? "Submitting..." : preview ? "Preview Mode" : "Submit Response"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ResponseList({ formWithResponses }: { formWithResponses: FormWithResponsesAndAnalytics }) {
  const [activeTab, setActiveTab] = useState("summary")
  const hasResponses = formWithResponses.responses && formWithResponses.responses.length > 0

  const EmptyState = () => (
    <Card className="bg-gray-50">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No responses yet</h3>
        <p className="text-gray-500 text-center mb-4">Share your form to start collecting responses.</p>
        {formWithResponses.published ? (
          <div className="text-sm text-gray-500">Form URL has been generated and is ready to be shared</div>
        ) : (
         <Alert className="max-w-md bg-blue-100 text-blue-700">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>Publish your form to start collecting responses</AlertDescription>
</Alert>

        )}
      </CardContent>
    </Card>
  )

  const renderSummary = () => {
    if (!hasResponses) return <EmptyState />

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formWithResponses.responses.length}</p>
                <p className="text-sm text-gray-500">Total Responses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formWithResponses.expected_participants}</p>
                <p className="text-sm text-gray-500">Expected Responses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formWithResponses.expected_participants
                    ? `${Math.round((formWithResponses.responses.length / formWithResponses.expected_participants) * 100)}%`
                    : "N/A"}
                </p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {formWithResponses.questions.map((question: Question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.title}</CardTitle>
              <CardDescription>
                {question.type === "multiple-choice" || question.type === "checkbox"
                  ? `${formWithResponses.responses.length} responses`
                  : "Text responses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {question.type === "short-answer" || question.type === "paragraph" ? (
                <ul className="space-y-2">
                  {formWithResponses.responses.map((response) => {
                    const answer = response.answers.find((a) => a.question_id === question.id) as TextAnswer
                    return answer ? (
                      <li key={response.id} className="p-3 bg-gray-50 rounded-lg">
                        {answer.answer_text}
                      </li>
                    ) : null
                  })}
                </ul>
              ) : (
                <ul className="space-y-3">
  {question.options?.map((option) => {
    // Calculate the count of responses for this option
    const count = formWithResponses.responses.filter((response) =>
      response.answers.some((a) => {
        const optionId = (a as OptionAnswer).option_id;
        return (
          a.question_id === question.id &&
          (Array.isArray(optionId)
            ? optionId.includes(option.id)
            : optionId === option.id)
        );
      }),
    ).length;

    // Calculate percentage
    const percentage = (count / formWithResponses.responses.length) * 100 || 0;

    return (
      <li key={option.id}>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{option.option_text}</span>
          <span className="text-sm text-gray-500">{count} responses</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
      </li>
    );
  })}
</ul>

              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderIndividual = () => {
    if (!hasResponses) return <EmptyState />

    return (
      <div className="space-y-6">
        {formWithResponses.responses.map((response) => (
          <Card key={response.id} className="hover:bg-gray-50 transition-colors duration-200">
            <CardHeader>
              <CardTitle className="text-lg">Response #{response.id}</CardTitle>
              <CardDescription>
                Submitted on {new Date(response.created_at).toLocaleDateString()} at{" "}
                {new Date(response.created_at).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formWithResponses.questions.map((question: Question) => {
                const answer = response.answers.find((a) => a.question_id === question.id)
                return (
                  <div key={question.id} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                    {answer && (
                      <p className="text-gray-600">
                        {question.type === "short-answer" || question.type === "paragraph"
                          ? (answer as TextAnswer).answer_text
                          : question.options
                              ?.filter((o) => {
                                const optionAnswer = answer as OptionAnswer
                                if (Array.isArray(optionAnswer.option_id)) {
                                  return optionAnswer.option_id.includes(o.id)
                                }
                                return optionAnswer.option_id === o.id
                              })
                              .map((o) => o.option_text)
                              .join(", ")}
                      </p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="individual">Individual Responses</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">{renderSummary()}</TabsContent>
        <TabsContent value="individual">{renderIndividual()}</TabsContent>
      </Tabs>
    </div>
  )
}

function AnalyticsView({ formData }: { formData: FormWithResponsesAndAnalytics }) {
  if (!formData.responses || formData.responses.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p>No responses available for analytics.</p>
        </CardContent>
      </Card>
    )
  }

  const getQuestionData = (question: Question) => {
    if (question.type === "multiple-choice" || question.type === "checkbox") {
      const data = question.options?.map((option) => {
        const count = formData.responses.filter((response) => {
          const answer = response.answers.find((a) => a.question_id === question.id) as OptionAnswer | undefined
          if (!answer) return false

          return Array.isArray(answer.option_id) ? answer.option_id.includes(option.id) : answer.option_id === option.id
        }).length

        return {
          name: option.option_text,
          value: count,
        }
      })
      return data || []
    }
    return []
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Responses: {formData.responses.length}</p>
          <p>Expected Responses: {formData.expected_participants || "Not specified"}</p>
          <p>
            Completion Rate:{" "}
            {formData.expected_participants
              ? `${Math.round((formData.responses.length / formData.expected_participants) * 100)}%`
              : "N/A"}
          </p>
        </CardContent>
      </Card>

      {formData.questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle>{question.title}</CardTitle>
            <CardDescription>{question.type}</CardDescription>
          </CardHeader>
          <CardContent>
            {question.type === "multiple-choice" || question.type === "checkbox" ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getQuestionData(question)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ul className="space-y-2">
                {formData.responses.map((response) => {
                  const answer = response.answers.find((a) => a.question_id === question.id) as TextAnswer
                  return answer ? (
                    <li key={response.id} className="p-3 bg-gray-50 rounded-lg">
                      {answer.answer_text}
                    </li>
                  ) : null
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

