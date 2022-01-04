import { KubeConfig }                from '@kubernetes/client-node'
import { join }                      from 'path'
import faker                         from 'faker'
import { setTimeout }                from 'node:timers/promises'

import { cluster }                   from '@atls/k8s-test-utils'
import { KubeCtl }                   from '@atls/k8s-kubectl-tool'
import { PreviewVersionApi }         from '@atls/k8s-preview-automation-api'
import { PreviewAutomationApi }      from '@atls/k8s-preview-automation-api'

import { PreviewAutomationOperator } from '../src'

jest.setTimeout(120000)

describe('preview-automation.operator', () => {
  let previewAutomationApi: PreviewAutomationApi
  let previewVersionApi: PreviewVersionApi
  let operator: PreviewAutomationOperator
  let kubeConfig: KubeConfig

  beforeAll(async () => {
    kubeConfig = await cluster.getKubeConfig()

    previewVersionApi = new PreviewVersionApi(kubeConfig)
    previewAutomationApi = new PreviewAutomationApi(kubeConfig)

    const kubectl = new KubeCtl(kubeConfig)

    await kubectl.applyFolder(join(__dirname, 'crd'))
    await kubectl.applyFolder(join(__dirname, 'specs'))
  })

  beforeEach(async () => {
    operator = new PreviewAutomationOperator(kubeConfig)

    await operator.start()
  })

  afterEach(async () => {
    if (operator) {
      operator.stop()
    }
  })

  it('create and delete preview version', async () => {
    const resource = faker.random.word().toLowerCase()

    await setTimeout(5000)
  })
})
