/**
 * Script to add username to admin/user accounts
 * Usage: bun run src/scripts/add-username.ts
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function addUsername() {
  const payload = await getPayload({ config })

  // Find admin/user accounts without username
  const { docs: users } = await payload.find({
    collection: 'users',
    where: {
      and: [
        { role: { in: ['admin', 'user'] } },
        { username: { exists: false } },
      ],
    },
  })

  console.log(`Found ${users.length} admin/user accounts without username:`)

  for (const user of users) {
    console.log(`\n- ${user.email} (${user.role})`)

    // Generate username from email (before @)
    const suggestedUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    console.log(`  Suggested username: ${suggestedUsername}`)

    // Update user with username
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        username: suggestedUsername,
      },
    })

    console.log(`  ✅ Username set to: ${suggestedUsername}`)
  }

  console.log('\n✅ All done!')
  process.exit(0)
}

addUsername().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
