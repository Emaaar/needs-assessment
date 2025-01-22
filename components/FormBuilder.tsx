"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { FormData, Question, Option } from "@/types/form"

interface FormBuilderProps {
  initialData: FormData
  onFormUpdate: (updatedForm: FormData) => void
}

export function FormBuilder({ initialData, onFormUpdate }: FormBuilderProps) {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [publishedLink, setPublishedLink] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const updatedForm = { ...prev, [field]: value }
      onFormUpdate(updatedForm)
      return updatedForm
    })
  }

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setFormData((prev) => {
      const updatedQuestions = prev.questions.map((q) =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
      const updatedForm = { ...prev, questions: updatedQuestions }
      onFormUpdate(updatedForm)
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
    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        questions: [...prev.questions, newQuestion],
      }
      onFormUpdate(updatedForm)
      return updatedForm
    })
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
      setFormData((prev) => {
        const updatedForm = { ...prev, id: result.id }
        onFormUpdate(updatedForm)
        return updatedForm
      })
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
      setPublishedLink(data.publishedLink)
      setFormData((prev) => {
        const updatedForm = {
          ...prev,
          published: true,
          publish_token: data.publish_token,
        }
        onFormUpdate(updatedForm)
        return updatedForm
      })
      toast({
        title: "Success",
        description: "Form published successfully!",
      })
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
      <Card>
        <CardHeader>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
            placeholder="Enter form title..."
            required
          />
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter form description..."
            className="resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Partner Name</label>
            <Input
              type="text"
              value={formData.partner_name}
              onChange={(e) => handleInputChange("partner_name", e.target.value)}
              placeholder="Enter partner name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Participants</label>
            <Input
              type="number"
              min="1"
              value={formData.expected_participants || ""}
              onChange={(e) => handleInputChange("expected_participants", +e.target.value || 0)}
              placeholder="Enter expected number"
            />
          </div>
        </CardContent>
      </Card>

      {formData.questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="space-y-4 pt-4">
            <Input
              type="text"
              value={question.title}
              onChange={(e) => handleQuestionUpdate({ ...question, title: e.target.value })}
              placeholder="Enter question"
              className="text-lg"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={question.type}
                onValueChange={(value) => 
                  handleQuestionUpdate({ 
                    ...question, 
                    type: value as Question["type"],
                    options: value === "multiple-choice" || value === "checkbox" ? [] : undefined
                  })
                }
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

              <div className="flex items-center space-x-2">
                <Switch
                  checked={question.required}
                  onCheckedChange={(checked) => 
                    handleQuestionUpdate({ ...question, required: checked })
                  }
                  id={`required-${question.id}`}
                />
                <label htmlFor={`required-${question.id}`} className="text-sm">Required</label>
              </div>
            </div>

            {(question.type === "multiple-choice" || question.type === "checkbox") && (
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])]
                        newOptions[optionIndex] = {
                          ...option,
                          option_text: e.target.value,
                        }
                        handleQuestionUpdate({ ...question, options: newOptions })
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = question.options?.filter(
                          (_, idx) => idx !== optionIndex
                        )
                        handleQuestionUpdate({ ...question, options: newOptions })
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleInputChange(
                    "questions",
                    formData.questions.filter((q) => q.id !== question.id)
                  )
                }
              >
                Delete Question
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" onClick={addQuestion} variant="outline" className="w-full">
        Add Question
      </Button>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Form"}
        </Button>
        <Button
          type="button"
          onClick={publishForm}
          disabled={!formData.id || formData.published || isPublishing}
          className="flex-1"
        >
          {isPublishing ? "Publishing..." : formData.published ? "Published" : "Publish"}
        </Button>
      </div>

      {publishedLink && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Published Link</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={`${window.location.origin}/forms/${formData.id}/respond?token=${formData.publish_token}`}
                  readOnly
                />
                <Button
                  onClick={() => {
                    const linkToCopy = `${window.location.origin}/forms/${formData.id}/respond?token=${formData.publish_token}`
                    navigator.clipboard.writeText(linkToCopy)
                    toast({
                      title: "Copied",
                      description: "Link copied to clipboard",
                    })
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
