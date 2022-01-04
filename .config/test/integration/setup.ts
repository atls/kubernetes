import { cluster } from '@atls/k8s-test-utils'

export default async () => {
  await cluster.start()
}
