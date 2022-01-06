import { PreviewAutomationOperator }      from '@atls/k8s-preview-automation-operator'
import { PreviewImageReflectorOperator }  from '@atls/k8s-preview-image-reflector-operator'
import { PreviewNotificationOperator }    from '@atls/k8s-preview-notification-operator'
import { PreviewPullRequestSyncOperator } from '@atls/k8s-preview-pull-request-sync-operator'
import { PreviewRouterOperator }          from '@atls/k8s-preview-router-operator'

const bootstrap = async () => {
  const automationOperator = new PreviewAutomationOperator()
  const imageReflectorOperator = new PreviewImageReflectorOperator()
  const routerOperator = new PreviewRouterOperator()
  const notificationOperator = new PreviewNotificationOperator({
    token: process.env.GITHUB_TOKEN!,
  })
  const pullRequestSyncOperator = new PreviewPullRequestSyncOperator({
    token: process.env.GITHUB_TOKEN!,
  })

  await Promise.all([
    automationOperator.start(),
    imageReflectorOperator.start(),
    routerOperator.start(),
    notificationOperator.start(),
    pullRequestSyncOperator.start(),
  ])

  const exit = (reason: string) => {
    console.log(reason) // eslint-disable-line no-console

    imageReflectorOperator.stop()
    automationOperator.stop()
    routerOperator.stop()
    notificationOperator.stop()
    pullRequestSyncOperator.stop()

    process.exit(0)
  }

  process.on('SIGTERM', () => exit('SIGTERM')).on('SIGINT', () => exit('SIGINT'))
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
