import { AuthManager, type User } from '@/lib/auth'
import { afterEach, describe, expect, it } from 'vitest'

const registerData = (overrides: Record<string, unknown> = {}) => ({
  email: 'test@example.com',
  username: 'tester',
  password: 'password123',
  confirmPassword: 'password123',
  acceptTerms: true,
  ...overrides,
})

describe('AuthManager', () => {
  describe('register', () => {
    afterEach(async () => {
      // 清理已注册用户，保持用例独立
      const user = await AuthManager.login({ email: 'test@example.com', password: 'password' })
      if (user.success && user.user) await AuthManager.deleteUser(user.user.id)
    })

    it('合法数据应注册成功', async () => {
      const result = await AuthManager.register(registerData())
      expect(result.success).toBe(true)
      expect(result.user?.role).toBe('user')
    })

    it('缺少必填字段应失败', async () => {
      const result = await AuthManager.register(registerData({ email: '' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('必填')
    })

    it('两次密码不一致应失败', async () => {
      const result = await AuthManager.register(registerData({ confirmPassword: 'different' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('不匹配')
    })

    it('密码不足 8 位应失败', async () => {
      const result = await AuthManager.register(registerData({ password: 'short', confirmPassword: 'short' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('8位')
    })

    it('未同意条款应失败', async () => {
      const result = await AuthManager.register(registerData({ acceptTerms: false }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('条款')
    })

    it('重复邮箱应失败', async () => {
      await AuthManager.register(registerData())
      const again = await AuthManager.register(registerData({ username: 'another' }))
      expect(again.success).toBe(false)
      expect(again.error).toContain('已被注册')
    })

    it('重复用户名应失败', async () => {
      await AuthManager.register(registerData())
      const again = await AuthManager.register(registerData({ email: 'x@example.com' }))
      expect(again.success).toBe(false)
      expect(again.error).toContain('已被使用')
    })
  })

  describe('login / token', () => {
    it('admin 默认账户应可登录', async () => {
      const result = await AuthManager.login({ email: 'admin@example.com', password: 'anything' })
      expect(result.success).toBe(true)
      expect(result.user?.role).toBe('admin')
      expect(result.accessToken).toBeTruthy()
      expect(result.refreshToken).toMatch(/^refresh_/)
    })

    it('未知邮箱登录应失败', async () => {
      const result = await AuthManager.login({ email: 'ghost@x.com', password: 'password' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('错误')
    })

    it('generateToken → verifyToken 应往返', () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const token = AuthManager.generateToken(admin)
      const payload = AuthManager.verifyToken(token)
      expect(payload?.userId).toBe(admin.id)
      expect(payload?.role).toBe('admin')
    })

    it('verifyToken 篡改令牌应返回 null', () => {
      expect(AuthManager.verifyToken('not-a-valid-token')).toBeNull()
    })

    it('verifyToken 过期令牌应返回 null', () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const payload = { userId: admin.id, email: admin.email, role: admin.role, iat: 0, exp: 1 }
      expect(AuthManager.verifyToken(btoa(JSON.stringify(payload)))).toBeNull()
    })

    it('refreshAccessToken 应签发新访问令牌', async () => {
      const login = await AuthManager.login({ email: 'admin@example.com', password: 'x' })
      const refreshed = await AuthManager.refreshAccessToken(login.refreshToken!)
      expect(refreshed?.accessToken).toBeTruthy()
      expect(refreshed?.user.role).toBe('admin')
    })

    it('refreshAccessToken 无效令牌返回 null', async () => {
      expect(await AuthManager.refreshAccessToken('bogus')).toBeNull()
    })

    it('logout 应清除 refresh token', async () => {
      const login = await AuthManager.login({ email: 'admin@example.com', password: 'x' })
      await AuthManager.logout(login.refreshToken)
      expect(await AuthManager.refreshAccessToken(login.refreshToken!)).toBeNull()
    })
  })

  describe('permissions & roles', () => {
    const users = {
      admin: {
        role: 'admin',
        permissions: {
          canManageUsers: true,
          canExportData: true,
          maxSearchesPerDay: -1,
          canCreateKnowledgeGraph: true,
          canAccessPremiumFeatures: true,
          canUseAdvancedAI: true,
          maxStorageGB: -1,
        },
      },
      guest: {
        role: 'guest',
        permissions: {
          canManageUsers: false,
          canExportData: false,
          maxSearchesPerDay: 10,
          canCreateKnowledgeGraph: false,
          canAccessPremiumFeatures: false,
          canUseAdvancedAI: false,
          maxStorageGB: 0,
        },
      },
    } as unknown as Record<'admin' | 'guest', User>

    it('hasPermission 应识别布尔与无限制(-1)', () => {
      expect(AuthManager.hasPermission(users.admin, 'canManageUsers')).toBe(true)
      expect(AuthManager.hasPermission(users.admin, 'maxSearchesPerDay')).toBe(true)
      expect(AuthManager.hasPermission(users.guest, 'canManageUsers')).toBe(false)
    })

    it('hasRole 应支持角色层级', () => {
      expect(AuthManager.hasRole(users.admin, 'user')).toBe(true)
      expect(AuthManager.hasRole(users.guest, 'admin')).toBe(false)
      expect(AuthManager.hasRole(users.guest, 'guest')).toBe(true)
    })
  })

  describe('user lifecycle', () => {
    it('updateUser 应合并更新', async () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const result = await AuthManager.updateUser(admin.id, { username: 'renamed-admin' })
      expect(result.success).toBe(true)
      expect(result.user?.username).toBe('renamed-admin')
    })

    it('updateUser 不存在用户应失败', async () => {
      expect((await AuthManager.updateUser('ghost', {})).success).toBe(false)
    })

    it('deleteUser 不允许删除管理员', async () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const result = await AuthManager.deleteUser(admin.id)
      expect(result.success).toBe(false)
      expect(result.error).toContain('管理员')
    })

    it('deleteUser 普通用户应成功', async () => {
      await AuthManager.register(registerData({ email: 'del@example.com', username: 'deleteme' }))
      const login = await AuthManager.login({ email: 'del@example.com', password: 'password' })
      const result = await AuthManager.deleteUser(login.user!.id)
      expect(result.success).toBe(true)
    })

    it('resetPassword 未注册邮箱应失败', async () => {
      const result = await AuthManager.resetPassword('ghost@x.com')
      expect(result.success).toBe(false)
    })

    it('changePassword 新密码不足 8 位应失败', async () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const result = await AuthManager.changePassword(admin.id, 'password', 'short')
      expect(result.success).toBe(false)
      expect(result.error).toContain('8位')
    })

    it('changePassword 旧密码错误应失败', async () => {
      const admin = AuthManager.getAllUsers().find((u) => u.role === 'admin') as User
      const result = await AuthManager.changePassword(admin.id, 'wrong', 'newpassword123')
      expect(result.success).toBe(false)
      expect(result.error).toContain('原密码')
    })
  })
})
