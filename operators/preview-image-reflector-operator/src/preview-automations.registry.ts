import { PreviewAutomationResource } from '@atls/k8s-preview-automation-api'

export class PreviewAutomationsRegistry {
  private readonly automations = new Map<string, PreviewAutomationResource>()

  private getImageRegistryKey(resource) {
    const { imageRepositoryRef } = resource.spec

    return `${imageRepositoryRef.name}-${
      imageRepositoryRef.namespace || resource.metadata.namespace
    }`
  }

  getByKey(key: string) {
    return this.automations.get(key)
  }

  hasByKey(key: string) {
    return this.automations.has(key)
  }

  add(automation: PreviewAutomationResource) {
    this.automations.set(this.getImageRegistryKey(automation), automation)
  }

  delete(automation: PreviewAutomationResource) {
    this.automations.delete(this.getImageRegistryKey(automation))
  }

  getByImagePolicy(imagePolicy): PreviewAutomationResource | undefined {
    return this.automations.get(this.getImageRegistryKey(imagePolicy))
  }
}
