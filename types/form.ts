// Base interfaces for form structure
export interface Option {
  id: number
  question_id: number
  option_text: string
}

export interface Question {
  id: number
  form_id: number
  title: string
  type: "multiple-choice" | "checkbox" | "short-answer" | "paragraph"
  required: boolean
  options?: Option[]
}

export interface FormData {
  id?: number
  title: string
  description: string
  partner_name: string
  expected_participants: number
  published: boolean
  publish_token?: string
  questions: Question[]
}

// Interfaces for form submissions and answers
export interface FormSubmission {
  formId: number
  publish_token: string
  answers: {
    questionId: number
    value: string | string[]
  }[]
}

export interface TextAnswer {
  id: number
  response_id: number
  question_id: number
  answer_text: string
}

export interface OptionAnswer {
  id: number
  response_id: number
  question_id: number
  option_id: number[] // Array of selected option IDs
}

// Response interfaces
export interface FormResponse {
  id: number
  form_id: number
  created_at: string
  publish_token: string  // Added this field
  answers: (TextAnswer | OptionAnswer)[]
}

// Analytics and expected response interfaces
export interface ExpectedResponse {
  questionId: number
  expectedValue: string | string[]
}

export interface QuestionAnalytics {
  totalResponses: number
  shortAnswers?: string[]
  optionCounts?: {
    [key: number]: number
  }
}

export interface FormAnalytics {
  totalResponses: number
  questionAnalytics: {
    [key: number]: QuestionAnalytics
  }
}

export interface FormWithResponsesAndAnalytics extends FormData {
  responses: {
    id: number
    created_at: string
    answers: (TextAnswer | OptionAnswer)[]
  }[]
  analytics: FormAnalytics
  expectedResponses: ExpectedResponse[]
}

// Base interfaces for form structure
interface BaseAnswer {
  question_id: number
}


type Answer = TextAnswer | OptionAnswer

export interface Option {
  id: number
  question_id: number
  option_text: string
}

export interface Question {
  id: number
  form_id: number
  title: string
  type: "multiple-choice" | "checkbox" | "short-answer" | "paragraph"
  required: boolean
  options?: Option[]
}

export interface FormData {
  id?: number
  title: string
  description: string
  partner_name: string
  expected_participants: number
  published: boolean
  publish_token?: string
  questions: Question[]
}

// Interfaces for form submissions and answers
export interface FormSubmission {
  formId: number
  publish_token: string
  answers: {
    questionId: number
    value: string | string[]
  }[]
}

// Response interfaces
export interface FormResponse {
  id: number
  form_id: number
  created_at: string
  publish_token: string // Added this field
  answers: (TextAnswer | OptionAnswer)[]
}

// Analytics and expected response interfaces
export interface ExpectedResponse {
  questionId: number
  expectedValue: string | string[]
}

export interface QuestionAnalytics {
  totalResponses: number
  shortAnswers?: string[]
  optionCounts?: {
    [key: number]: number
  }
}

export interface FormAnalytics {
  totalResponses: number
  questionAnalytics: {
    [key: number]: QuestionAnalytics
  }
}

export interface FormWithResponsesAndAnalytics extends FormData {
  responses: {
    id: number
    created_at: string
    answers: (TextAnswer | OptionAnswer)[]
  }[]
  analytics: FormAnalytics
  expectedResponses: ExpectedResponse[]
}

