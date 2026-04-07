/**
 * Subscriber that ensures auth identities created via emailpass
 * have `admin_id` in app_metadata so the JWT token is properly
 * generated with actor_id populated.
 *
 * When a user is created through the Medusa CLI or API, the
 * auth_identity may only have `user_id`. The JWT generator
 * (generateJwtTokenForAuthIdentity) looks for `{actorType}_id`
 * which for admin auth means `admin_id`.
 */
import type { SubscriberConfig, SubscriberArgs } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

async function ensureAdminIdInAuthIdentity({ event, container }: SubscriberArgs<{ entity_id: string }>) {
  const authModule = container.resolve(Modules.AUTH)
  const query = container.resolve('query')

  const authIdentities = await authModule.listAuthIdentities({
    app_metadata: {
      $or: [
        { admin_id: { $exists: false } },
        { admin_id: null },
      ],
    },
    user_id: { $exists: true },
  })

  for (const authIdentity of authIdentities) {
    const userId = authIdentity.app_metadata?.user_id
    if (userId) {
      await authModule.updateAuthIdentities([
        {
          id: authIdentity.id,
          app_metadata: {
            ...authIdentity.app_metadata,
            admin_id: userId,
          },
        },
      ])
    }
  }
}

export default ensureAdminIdInAuthIdentity

export const config: SubscriberConfig = {
  event: ['user.created', 'user.updated'],
}
