"use client"

import React from "react"
import type { FormWithResponsesAndAnalytics, ExpectedResponse } from "@/types/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface AnalyticsViewProps {
  formData: FormWithResponsesAndAnalytics
}

export function AnalyticsView({ formData }: AnalyticsViewProps) {
  const getExpectedResponse = (questionId: number): ExpectedResponse | undefined => {
    return formData.expectedResponses.find((er) => er.questionId === questionId)
  }

  const calculateExpectedPercentage = (questionId: number, optionId: number): number => {
    const expectedResponse = getExpectedResponse(questionId)
    if (!expectedResponse) return 0

    const expectedValue = Array.isArray(expectedResponse.expectedValue)
      ? expectedResponse.expectedValue
      : [expectedResponse.expectedValue]

    return expectedValue.includes(optionId.toString()) ? 100 : 0
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Responses: {formData.analytics.totalResponses}</p>
        </CardContent>
      </Card>

      {formData.questions.map((question) => {
        const analytics = formData.analytics.questionAnalytics[question.id]
        const expectedResponse = getExpectedResponse(question.id)

        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.title}</CardTitle>
              <CardDescription>{question.type}</CardDescription>
            </CardHeader>
            <CardContent>
              {(question.type === "short-answer" || question.type === "paragraph") && (
                <div>
                  <h4 className="font-semibold mb-2">Responses:</h4>
                  <ul className="list-disc pl-5">
                    {analytics.shortAnswers?.map((answer, index) => (
                      <li
                        key={index}
                        className={answer === expectedResponse?.expectedValue ? "text-green-600 font-bold" : ""}
                      >
                        {answer}
                      </li>
                    ))}
                  </ul>
                  {expectedResponse && (
                    <p className="mt-2">
                      <span className="font-semibold">Expected Response: </span>
                      <span className="text-blue-600">{expectedResponse.expectedValue}</span>
                    </p>
                  )}
                </div>
              )}

              {(question.type === "multiple-choice" || question.type === "checkbox") && (
                <div>
                  <h4 className="font-semibold mb-2">Response Distribution:</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={question.options?.map((option) => ({
                        name: option.option_text,
                        count: analytics.optionCounts?.[option.id] || 0,
                        expected: calculateExpectedPercentage(question.id, option.id),
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                      <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" />
                      <Bar dataKey="expected" fill="none" stroke="red" />
                    </BarChart>
                  </ResponsiveContainer>
                  {question.options?.map((option) => {
                    const count = analytics.optionCounts?.[option.id] || 0
                    const percentage = (count / analytics.totalResponses) * 100
                    const expectedPercentage = calculateExpectedPercentage(question.id, option.id)
                    return (
                      <div key={option.id} className="mt-2">
                        <div className="flex justify-between items-center">
                          <span>{option.option_text}</span>
                          <span>
                            {count} ({percentage.toFixed(2)}%)
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={percentage} className="mt-1" />
                          {expectedPercentage > 0 && (
                            <div
                              className="absolute top-0 h-full border-r-2 border-red-500"
                              style={{ left: `${expectedPercentage}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

