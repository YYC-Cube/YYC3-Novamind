import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button 组件', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument()
  })

  it('应该应用 variant=outline 的样式类', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button', { name: 'Outline' })
    expect(btn.className).toMatch(/border/)
  })

  it('点击时应触发 onClick 处理器', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>点我</Button>)

    await user.click(screen.getByRole('button', { name: '点我' }))
    expect(clicked).toBe(true)
  })

  it('disabled 时不应触发 onClick', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button disabled onClick={() => { clicked = true }}>禁用</Button>)

    const btn = screen.getByRole('button', { name: '禁用' })
    expect(btn).toBeDisabled()

    await user.click(btn)
    expect(clicked).toBe(false)
  })
})
