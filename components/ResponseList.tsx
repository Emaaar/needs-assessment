"use client"

import { useState } from "react"
import type { FormWithResponsesAndAnalytics, Question, Option, TextAnswer, OptionAnswer } from "@/types/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsView } from "./AnalyticsView"

interface ResponseListProps {
  formWithResponses: FormWithResponsesAndAnalytics
}

export function ResponseList({ formWithResponses }: ResponseListProps) {
  const [activeTab, setActiveTab] = useState("analytics")

  const renderSummary = () => {
    return (
      <div className="space-y-6">
        {formWithResponses.questions.map((question: Question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.title}</CardTitle>
              <CardDescription>{question.type}</CardDescription>
            </CardHeader>
            <CardContent>
              {question.type === "short-answer" || question.type === "paragraph" ? (
                <ul className="list-disc pl-5">
                  {formWithResponses.responses.map((response) => {
                    const answer = response.answers.find((a) => a.question_id === question.id) as TextAnswer | undefined
                    return answer ? <li key={response.id}>{answer.answer_text}</li> : null
                  })}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {question.options?.map((option: Option) => {
                    const count = formWithResponses.responses.filter((response) =>
                      response.answers.some((a) => {
                        if ("option_id" in a) {
                          return Array.isArray(a.option_id)
                            ? a.option_id.includes(option.id)
                            : a.option_id === option.id
                        }
                        return false
                      }),
                    ).length
                    const percentage = (count / formWithResponses.responses.length) * 100 || 0
                    return (
                      <li key={option.id} className="flex items-center">
                        <span className="w-1/2">{option.option_text}</span>
                        <div className="w-1/2 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="ml-2">{count}</span>
                      </li>
                    )
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
    return (
      <div className="space-y-6">
        {formWithResponses.responses.map((response) => (
          <Card key={response.id}>
            <CardHeader>
              <CardTitle>Response #{response.id}</CardTitle>
              <CardDescription>{new Date(response.created_at).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              {formWithResponses.questions.map((question: Question) => {
                const answer = response.answers.find((a) => a.question_id === question.id)
                return (
                  <div key={question.id} className="mb-4">
                    <h4 className="font-semibold">{question.title}</h4>
                    {answer && (
                      <p>
                        {question.type === "short-answer" || question.type === "paragraph"
                          ? (answer as TextAnswer).answer_text
                          : question.options?.find((o) => {
                              const optionAnswer = answer as OptionAnswer
                              return Array.isArray(optionAnswer.option_id)
                                ? optionAnswer.option_id.includes(o.id)
                                : optionAnswer.option_id === o.id
                            })?.option_text}
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
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="individual">Individual Responses</TabsTrigger>
      </TabsList>
      <TabsContent value="analytics">
        <AnalyticsView formData={formWithResponses} />
      </TabsContent>
      <TabsContent value="summary">{renderSummary()}</TabsContent>
      <TabsContent value="individual">{renderIndividual()}</TabsContent>
    </Tabs>
  )
}

