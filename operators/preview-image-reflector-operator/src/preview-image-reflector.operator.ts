import { KubeConfig }                       from '@kubernetes/client-node'
import { HttpError }                        from '@kubernetes/client-node'

import deepEqual                            from 'deep-equal'
import parseDockerImage                     from 'parse-docker-image-name'

import { ImagePolicyResource }              from '@atls/k8s-flux-toolkit-api'
import { ImagePolicyDomain }                from '@atls/k8s-flux-toolkit-api'
import { ImagePolicyResourceVersion }       from '@atls/k8s-flux-toolkit-api'
import { ImagePolicyResourceGroup }         from '@atls/k8s-flux-toolkit-api'
import { Operator }                         from '@atls/k8s-operator'
import { ResourceEventType }                from '@atls/k8s-operator'
import { PreviewAutomationResourceVersion } from '@atls/k8s-preview-automation-api'
import { PreviewAutomationResourceGroup }   from '@atls/k8s-preview-automation-api'
import { PreviewAutomationResource }        from '@atls/k8s-preview-automation-api'
import { PreviewAutomationDomain }          from '@atls/k8s-preview-automation-api'
import { PreviewVersionApi }                from '@atls/k8s-preview-automation-api'
import { PreviewVersionSpec }               from '@atls/k8s-preview-automation-api'
import { kind2Plural }                      from '@atls/k8s-resource-utils'

import { PreviewAutomationsRegistry }       from './preview-automations.registry'

export class PreviewImageReflectorOperator extends Operator {
  private readonly automationRegistry = new PreviewAutomationsRegistry()

  private readonly previewVersionApi: PreviewVersionApi

  constructor(kubeConfig?: KubeConfig) {
    super(kubeConfig)

    this.previewVersionApi = new PreviewVersionApi(this.kubeConfig)
  }

  getAutomationRegistry() {
    return this.automationRegistry
  }

  private parseTag(tag: string) {
    const [context, hash] = tag.split('-')

    return {
      context,
      hash,
    }
  }

  private async resourceModified(resource) {
    const automation = this.automationRegistry.getByImagePolicy(resource)

    if (!automation) {
      return
    }

    const { filterTags } = resource.spec

    if (filterTags.pattern !== '^[a-f0-9]+-[a-f0-9]+-(?P<ts>[0-9]+)') {
      return
    }

    const { latestImage } = resource.status

    if (!latestImage) {
      return
    }

    const { tag } = parseDockerImage(latestImage)
    const { context } = this.parseTag(tag)

    const name = `${automation.metadata!.name}-${context}`

    const spec: PreviewVersionSpec = {
      previewAutomationRef: {
        name: automation.metadata!.name!,
      },
      context: {
        kind: 'GitHubPullRequest',
        number: context,
      },
      tag,
    }

    try {
      const previewVersion = await this.previewVersionApi.getPreviewVersion(
        name,
        automation.metadata!.namespace!
      )

      if (!deepEqual(previewVersion.spec, spec)) {
        await this.previewVersionApi.patchPreviewVersion(name, [
          {
            op: 'replace',
            path: '/spec',
            value: spec,
          },
          automation.metadata!.namespace!,
        ])
      }
    } catch (error) {
      if ((error as HttpError).body?.code === 404) {
        await this.previewVersionApi.createPreviewVersion(
          name,
          spec,
          automation.metadata!.namespace!
        )
      } else {
        throw error
      }
    }
  }

  protected async init() {
    await Promise.all([
      this.watchResource(
        PreviewAutomationDomain.Group,
        PreviewAutomationResourceVersion.v1alpha1,
        kind2Plural(PreviewAutomationResourceGroup.PreviewAutomation),
        async (event) => {
          if (event.type === ResourceEventType.Added || event.type === ResourceEventType.Modified) {
            this.automationRegistry.add(event.object as PreviewAutomationResource)
          } else if (event.type === ResourceEventType.Deleted) {
            this.automationRegistry.delete(event.object as PreviewAutomationResource)
          }
        }
      ),
      this.watchResource(
        ImagePolicyDomain.Group,
        ImagePolicyResourceVersion.v1beta1,
        kind2Plural(ImagePolicyResourceGroup.ImagePolicy),
        async (event) => {
          if (event.type === ResourceEventType.Modified) {
            try {
              await this.resourceModified(event.object as ImagePolicyResource)
            } catch (error) {
              this.logger.error((error as HttpError).body)
            }
          }
        }
      ),
    ])
  }
}
