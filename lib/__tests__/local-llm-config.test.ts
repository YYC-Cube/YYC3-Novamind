import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalLLMConfigManager, type LocalLLMProvider } from '@/lib/local-llm-config'

const customProvider: LocalLLMProvider = {
  id: 'custom-local',
  name: 'My Server',
  baseUrl: 'http://192.168.1.10:11434',
  enabled: true,
  models: [
    {
      id: 'qwen2.5',
      name: 'qwen2.5',
      displayName: 'Qwen 2.5',
      provider: 'custom-local',
      contextLength: 32768,
      parameters: '7B',
    },
  ],
  type: 'custom',
}

describe('LocalLLMConfigManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('getDefaultConfig 应内置 Ollama 且默认启用', () => {
    const config = LocalLLMConfigManager.getDefaultConfig()
    expect(config.defaultProvider).toBe('ollama')
    expect(config.providers[0]?.id).toBe('ollama')
    expect(config.providers[0]?.enabled).toBe(true)
    expect(config.timeout).toBe(30_000)
  })

  it('getConfig 无存储时应返回默认配置', () => {
    const config = LocalLLMConfigManager.getConfig()
    expect(config.providers).toHaveLength(4)
  })

  it('saveConfig + getConfig 应持久化合并', () => {
    LocalLLMConfigManager.saveConfig({
      ...LocalLLMConfigManager.getDefaultConfig(),
      defaultModel: 'llama3',
    })

    const config = LocalLLMConfigManager.getConfig()
    expect(config.defaultModel).toBe('llama3')
    expect(config.providers).toHaveLength(4) // 默认字段未丢失
  })

  it('updateProvider 应合并更新指定提供商', () => {
    LocalLLMConfigManager.updateProvider('lm-studio', { enabled: true })
    const provider = LocalLLMConfigManager.getProvider('lm-studio')
    expect(provider?.enabled).toBe(true)
  })

  it('addCustomProvider + getAllModels 闭环', () => {
    LocalLLMConfigManager.addCustomProvider(customProvider)
    expect(LocalLLMConfigManager.getEnabledProviders()).toHaveLength(2) // ollama + custom

    const models = LocalLLMConfigManager.getAllModels()
    expect(models).toHaveLength(1)
    expect(models[0]?.displayName).toBe('Qwen 2.5')
  })

  it('removeProvider 应删除指定提供商', () => {
    LocalLLMConfigManager.addCustomProvider(customProvider)
    LocalLLMConfigManager.removeProvider('custom-local')
    expect(LocalLLMConfigManager.getProvider('custom-local')).toBeNull()
  })

  it('getModelsByProvider 未知提供商返回空数组', () => {
    expect(LocalLLMConfigManager.getModelsByProvider('ghost')).toEqual([])
  })

  it('损坏的存储应回退到默认配置', () => {
    localStorage.setItem('local-llm-config', '{broken json')
    const config = LocalLLMConfigManager.getConfig()
    expect(config.providers).toHaveLength(4)
  })
})
