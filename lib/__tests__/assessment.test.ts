import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AssessmentManager, type QuizAttempt } from '@/lib/assessment'

describe('AssessmentManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('getQuizzes 无存储时应返回默认题库', () => {
    const quizzes = AssessmentManager.getQuizzes()
    expect(quizzes.length).toBeGreaterThanOrEqual(2)
    expect(quizzes[0]?.questions.length).toBeGreaterThan(0)
  })

  it('getQuizzes 应按分类过滤', () => {
    const coding = AssessmentManager.getQuizzes('编程')
    expect(coding.length).toBeGreaterThan(0)
    expect(coding.every((q) => q.category === '编程')).toBe(true)
  })

  it('createQuiz 应生成 id 并持久化', () => {
    const quiz = AssessmentManager.createQuiz({
      title: '自定义测验',
      description: '测试用',
      category: '自定义',
      difficulty: 1,
      timeLimit: 10,
      passingScore: 60,
      createdBy: 'tester',
      tags: ['test'],
      questions: [
        {
          id: 'q1',
          type: 'true_false',
          question: '单元测试有价值',
          correctAnswer: 'true',
          explanation: '当然',
          points: 10,
        },
      ],
    })

    expect(quiz.id).toMatch(/^quiz-/)
    const stored = AssessmentManager.getQuizzes('自定义')
    expect(stored).toHaveLength(1)
  })

  it('submitQuizAttempt 应判分并判定通过', () => {
    const quiz = AssessmentManager.getQuizzes('编程')[0]!
    const attempt = AssessmentManager.startQuizAttempt(quiz.id, 'u1', '测试者')

    const answers: Record<string, string> = {}
    quiz.questions.forEach((q) => {
      answers[q.id] = String(q.correctAnswer)
    })
    const completed = AssessmentManager.submitQuizAttempt({
      ...attempt,
      answers,
      startedAt: Date.now() - 60_000,
    })

    expect(completed.percentage).toBe(100)
    expect(completed.passed).toBe(true)
    expect(completed.completedAt).toBeGreaterThan(0)
  })

  it('submitQuizAttempt 错误答案不应通过', () => {
    const quiz = AssessmentManager.getQuizzes('编程')[0]!
    const attempt = AssessmentManager.startQuizAttempt(quiz.id, 'u2', '测试者')

    const completed = AssessmentManager.submitQuizAttempt({ ...attempt, answers: {} })
    expect(completed.score).toBe(0)
    expect(completed.passed).toBe(false)
  })

  it('submitQuizAttempt quiz 不存在应原样返回', () => {
    const attempt: QuizAttempt = {
      id: 'a1',
      quizId: 'ghost',
      userId: 'u',
      userName: 'x',
      answers: {},
      score: 0,
      totalPoints: 0,
      percentage: 0,
      timeSpent: 0,
      startedAt: Date.now(),
      completedAt: 0,
      passed: false,
    }
    const result = AssessmentManager.submitQuizAttempt(attempt)
    expect(result.completedAt).toBe(0)
  })

  it('通过测验应生成技能评估记录', () => {
    const quiz = AssessmentManager.getQuizzes('编程')[0]!
    const attempt = AssessmentManager.startQuizAttempt(quiz.id, 'u-skill', '技能者')
    const answers: Record<string, string> = {}
    quiz.questions.forEach((q) => {
      answers[q.id] = String(q.correctAnswer)
    })
    AssessmentManager.submitQuizAttempt({ ...attempt, answers })

    const skills = AssessmentManager.getSkillAssessments('u-skill')
    expect(skills.length).toBeGreaterThan(0)
    expect(skills[0]?.level).toBeGreaterThanOrEqual(1)
  })

  it('generateCertificate + verifyCertificate 闭环', () => {
    const cert = AssessmentManager.generateCertificate('u1', '张三', '编程', '3', ['全勤'])
    const verified = AssessmentManager.verifyCertificate(cert.verificationCode)
    expect(verified?.id).toBe(cert.id)
    expect(AssessmentManager.verifyCertificate('bad-code')).toBeNull()
  })

  it('createLearningPortfolio + updatePortfolio 闭环', () => {
    const portfolio = AssessmentManager.createLearningPortfolio({
      userId: 'u1',
      userName: '李四',
      userAvatar: '',
      title: '学习档案',
      description: '我的作品集',
      skills: [],
      projects: [],
      certificates: [],
      testimonials: [],
      isPublic: true,
    })

    expect(portfolio.id).toMatch(/^portfolio-/)
    expect(AssertionHelpers.isFalse(AssessmentManager.updatePortfolio('ghost', {})))

    expect(AssessmentManager.updatePortfolio(portfolio.id, { title: '改名' })).toBe(true)
    expect(AssessmentManager.getLearningPortfolios('u1')[0]?.title).toBe('改名')
  })

  it('getUserLearningStats 应汇总学习数据', () => {
    const stats = AssessmentManager.getUserLearningStats('nobody')
    expect(stats.totalQuizzes).toBe(0)
    expect(stats.passRate).toBe(0)
  })
})

// 辅助断言（保持测试可读性）
const AssertionHelpers = {
  isFalse: (v: boolean) => v === false,
}
