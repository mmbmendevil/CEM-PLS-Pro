import type { AssessmentCompetencyBreakdown } from '../../services/assessmentProgress'

export type ReviewerPreference = 'flashcards' | 'audiobook' | 'cheatsheet-pdf' | 'cheatsheet-image'
export type AiReviewerPreference = Exclude<ReviewerPreference, 'flashcards'>

export type ReviewerQuestionItem = {
  id: number
  competencyCode: string
  module: string
  bloomLevel: string
  question: string
  options: string[]
  correctOptionIndex: number
  selectedOptionIndex?: number | null
}

export const reviewerPreferenceOptions: Array<{
  value: ReviewerPreference
  label: string
  hint: string
}> = [
  { value: 'flashcards', label: 'Flashcards', hint: 'Short Q&A cards for quick review drills.' },
  { value: 'audiobook', label: 'Audiobook Script', hint: 'Narration-style reviewer for listening practice.' },
  { value: 'cheatsheet-pdf', label: 'Cheatsheet PDF', hint: 'Compact sectioned notes optimized for print/PDF.' },
  { value: 'cheatsheet-image', label: 'Cheatsheet Image', hint: 'One-screen visual cheatsheet layout with concise bullets.' },
]

export const reviewerPreferenceLabelMap: Record<ReviewerPreference, string> = {
  flashcards: 'Flashcards',
  audiobook: 'Audiobook Script',
  'cheatsheet-pdf': 'Cheatsheet PDF',
  'cheatsheet-image': 'Cheatsheet Image',
}

export const getReviewerSystemInstruction = (reviewerPreference: AiReviewerPreference) => {
  if (reviewerPreference === 'audiobook') {
    return 'You are an expert tutor creating an audiobook-style reviewer script for undergraduate computer architecture students. Use natural spoken language, short sentences, and smooth transitions. Output exactly two major sections in this order: 1) Wrong Answers Review, 2) Correct Answers Reinforcement. Keep the order strict and do not swap sections. In each section, use short narration lines that sound good when read by TTS, avoid dense bullet dumps, and include brief recap lines.'
  }

  if (reviewerPreference === 'cheatsheet-pdf') {
    return 'You are an expert tutor creating a print-friendly reviewer for undergraduate computer architecture students. Keep the tone calm, supportive, and human. Use strict Q&A lines only. Output exactly two sections in this order: wrong answers, correct answers. In each section, every line must follow this pattern: question? answer. Do not use numbering, bullet marks, all-caps style, markdown headings, or labels like HIGHLIGHT. Questions should be sentence case and answers should start with a capital letter.'
  }

  if (reviewerPreference === 'cheatsheet-image') {
    return 'You are an expert tutor creating a one-screen visual reviewer for undergraduate computer architecture students. Keep the tone calm, supportive, and human. Use strict Q&A lines only. Output exactly two sections in this order: wrong answers, correct answers. In each section, every line must follow this pattern: question? answer. Do not use numbering, bullet marks, all-caps style, markdown headings, or labels like HIGHLIGHT. Questions should be sentence case and answers should start with a capital letter.'
  }

  return 'You are an expert tutor creating a concise reviewer for undergraduate computer architecture students.'
}

export const buildFallbackReviewer = ({
  score,
  totalItems,
  percentage,
  competencyBreakdown,
  reviewerPreference,
}: {
  score: number
  totalItems: number
  percentage: number
  competencyBreakdown: AssessmentCompetencyBreakdown
  reviewerPreference: ReviewerPreference
}) => {
  const competencySummary = Object.entries(competencyBreakdown)
    .map(([code, values]) => `- ${code}: ${values.correct}/${values.total} (${values.percentage}%)`)
    .join('\n')

  return [
    '## CORE HIGHLIGHTS',
    '- Wrong answers: review the ideas that caused misses first.',
    '- Correct answers: keep the strongest ideas active with short recall lines.',
    '',
    '## 1) Wrong Answers Review',
    `- Score snapshot: ${score}/${totalItems} (${percentage}%)`,
    `- Preferred reviewer format: ${reviewerPreferenceLabelMap[reviewerPreference]}`,
    competencySummary || '- Competency details were unavailable at generation time.',
    '',
    '## 2) Correct Answers Reinforcement',
    '- Revisit correctly answered concepts using short recall drills.',
    '',
    '## Personalized Reviewer Summary',
    'This fallback reviewer was generated from your saved results while AI response was unavailable. Start with your weakest competency, then reinforce your correct concepts.',
    '',
    '## Priority Topics',
    '1. Weakest competency domain',
    '2. Reinforcement for strong areas',
  ].join('\n')
}

export const buildReviewerPrompt = ({
  score,
  totalItems,
  percentage,
  competencyBreakdown,
  wrongQuestions,
  unseenQuestions,
  correctQuestions,
  reviewerPreference,
}: {
  score: number
  totalItems: number
  percentage: number
  competencyBreakdown: AssessmentCompetencyBreakdown
  wrongQuestions: ReviewerQuestionItem[]
  unseenQuestions: ReviewerQuestionItem[]
  correctQuestions: ReviewerQuestionItem[]
  reviewerPreference: ReviewerPreference
}) => {
  const competenciesText = Object.entries(competencyBreakdown)
    .map(([code, values]) => `${code}: ${values.correct}/${values.total} (${values.percentage}%)`)
    .join('\n')

  const mapQuestion = (item: ReviewerQuestionItem) => {
    const selectedLabel =
      item.selectedOptionIndex === null || item.selectedOptionIndex === undefined
        ? 'No answer selected'
        : item.options[item.selectedOptionIndex]

    return [
      `Question ${item.id} | ${item.module} (${item.competencyCode}) | Bloom: ${item.bloomLevel}`,
      `Prompt: ${item.question}`,
      `Student answer: ${selectedLabel}`,
      `Correct answer: ${item.options[item.correctOptionIndex]}`,
    ].join('\n')
  }

  const needsReviewQuestions = [...wrongQuestions, ...unseenQuestions]
  const needsReviewQuestionsText = needsReviewQuestions.map(mapQuestion).join('\n\n')
  const correctQuestionsText = correctQuestions.map(mapQuestion).join('\n\n')

  return [
    'You are an expert tutor in computer architecture.',
    'Create a personalized reviewer based on this prelim assessment result and question sheet from the diagnosticQuestions dataset.',
    'Use only the provided question data and competency details; do not invent extra questions, scores, or modules.',
    'Use simple student-friendly language and follow this strict priority order:',
    'Priority 1: wrong or missed questions (highest priority).',
    'Priority 2: correctly answered questions (lowest priority).',
    `Preferred reviewer format: ${reviewerPreferenceLabelMap[reviewerPreference]}.`,
    'Strictly shape the output to match the preferred format while keeping all required sections.',
    reviewerPreference === 'audiobook'
      ? 'For audiobook format, output exactly these section headings in order: "1) Wrong Answers Review", "2) Correct Answers Reinforcement". Keep each line concise (about 8-18 words), use spoken transitions like "Now" or "Next", and end each section with a one-line recap.'
      : reviewerPreference === 'cheatsheet-image'
        ? 'For cheatsheet image format, use exactly these section titles: wrong answers, correct answers. Under each section, write plain Q&A lines only: question? answer. No numbering, bullets, or markdown symbols. Keep wording simple, warm, and student-friendly.'
        : reviewerPreference === 'cheatsheet-pdf'
          ? 'For cheatsheet PDF format, use exactly these section titles: wrong answers, correct answers. Under each section, write plain Q&A lines only: question? answer. No numbering, bullets, or markdown symbols. Keep wording simple, warm, and student-friendly.'
      : 'For non-audiobook formats, preserve the same learning priority while adapting presentation style.',
    '',
    `Overall score: ${score}/${totalItems} (${percentage}%)`,
    '',
    'Competency breakdown:',
    competenciesText || 'No competency breakdown available.',
    '',
    'Incorrect or unanswered questions:',
    needsReviewQuestionsText || 'None',
    '',
    'Correctly answered questions:',
    correctQuestionsText || 'None',
  ].join('\n')
}
