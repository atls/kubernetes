import { CustomObjectsApi }               from '@kubernetes/client-node'
import { KubeConfig }                     from '@kubernetes/client-node'

import { kind2Plural }                    from '@atls/k8s-resource-utils'

import { ImageRepositoryResource }        from './image-repository.interfaces'
import { ImageRepositoryResourceVersion } from './image-repository.types'
import { ImageRepositoryResourceGroup }   from './image-repository.types'
import { ImageRepositoryDomain }          from './image-repository.types'

export class ImageRepositoryApi {
  private readonly customObjectsApi: CustomObjectsApi

  constructor(private readonly kubeConfig: KubeConfig) {
    this.customObjectsApi = this.kubeConfig.makeApiClient(CustomObjectsApi)
  }

  async getImageRepository(
    name: string,
    namespace: string = 'default'
  ): Promise<ImageRepositoryResource> {
    const { body } = await this.customObjectsApi.getNamespacedCustomObject(
      ImageRepositoryDomain.Group,
      ImageRepositoryResourceVersion.v1beta1,
      namespace,
      kind2Plural(ImageRepositoryResourceGroup.ImageRepository),
      name
    )

    return body as ImageRepositoryResource
  }
}
