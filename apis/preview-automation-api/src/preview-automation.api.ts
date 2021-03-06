import { CustomObjectsApi }                 from '@kubernetes/client-node'
import { KubernetesObject }                 from '@kubernetes/client-node'
import { KubeConfig }                       from '@kubernetes/client-node'
import { CoreV1Api }                        from '@kubernetes/client-node'
import { AppsV1Api }                        from '@kubernetes/client-node'

import { kind2Plural }                      from '@atls/k8s-resource-utils'
import { deploymentResourceToSpec }         from '@atls/k8s-resource-utils'
import { serviceResourceToSpec }            from '@atls/k8s-resource-utils'

import { PreviewAutomationResource }        from './preview-automation.interfaces'
import { PreviewAutomationSpec }            from './preview-automation.interfaces'
import { PreviewAutomationResourceVersion } from './preview-automation.types'
import { PreviewAutomationResourceGroup }   from './preview-automation.types'
import { PreviewAutomationResourceKind }    from './preview-automation.types'
import { PreviewAutomationDomain }          from './preview-domain.types'

export class PreviewAutomationApi {
  private readonly customObjectsApi: CustomObjectsApi

  private readonly appsApi: AppsV1Api

  private readonly coreApi: CoreV1Api

  constructor(private readonly kubeConfig: KubeConfig) {
    this.customObjectsApi = this.kubeConfig.makeApiClient(CustomObjectsApi)
    this.appsApi = this.kubeConfig.makeApiClient(AppsV1Api)
    this.coreApi = this.kubeConfig.makeApiClient(CoreV1Api)
  }

  async getPreviewAutomation(
    name: string,
    namespace: string = 'default'
  ): Promise<PreviewAutomationResource> {
    const { body } = await this.customObjectsApi.getNamespacedCustomObject(
      PreviewAutomationDomain.Group,
      PreviewAutomationResourceVersion.v1alpha1,
      namespace,
      kind2Plural(PreviewAutomationResourceGroup.PreviewAutomation),
      name
    )

    return body as PreviewAutomationResource
  }

  async getPreviewAutomationResources(
    automation: PreviewAutomationResource
  ): Promise<Array<KubernetesObject>> {
    return Promise.all(
      // eslint-disable-next-line consistent-return
      automation.spec.resources.map(async (resource) => {
        if (resource.kind === 'Service') {
          const service = await this.coreApi.readNamespacedService(
            resource.name,
            automation.metadata?.namespace || 'default'
          )

          return serviceResourceToSpec(service.body)
        }

        if (resource.kind === 'Deployment') {
          const deployment = await this.appsApi.readNamespacedDeployment(
            resource.name,
            automation.metadata?.namespace || 'default'
          )

          return deploymentResourceToSpec(deployment.body)
        }
      })
    )
  }

  async createPreviewAutomation(
    name: string,
    spec: Partial<PreviewAutomationSpec>,
    namespace: string = 'default'
  ) {
    return this.customObjectsApi.createNamespacedCustomObject(
      PreviewAutomationDomain.Group,
      PreviewAutomationResourceVersion.v1alpha1,
      namespace,
      kind2Plural(PreviewAutomationResourceGroup.PreviewAutomation),
      {
        apiVersion: `${PreviewAutomationDomain.Group}/${PreviewAutomationResourceVersion.v1alpha1}`,
        kind: PreviewAutomationResourceKind.PreviewAutomation,
        metadata: {
          namespace,
          name,
        },
        spec,
      }
    )
  }
}
