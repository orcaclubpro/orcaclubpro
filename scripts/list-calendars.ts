/**
 * Helper script to list all Google Calendars
 * Run this to find the calendar ID for "ORCACLUB" calendar
 *
 * Usage: bun run scripts/list-calendars.ts
 */

import { calendar, auth } from '@googleapis/calendar'

async function listCalendars() {
  try {
    // Parse the service account credentials
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL

    if (!credentials) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment')
      process.exit(1)
    }

    const parsedCredentials = JSON.parse(credentials)

    // Create auth client
    const googleAuth = new auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      clientOptions: delegatedUser ? {
        subject: delegatedUser,
      } : undefined,
    })

    // Initialize calendar client
    const calendarClient = calendar({ version: 'v3', auth: googleAuth })

    console.log('📅 Fetching calendars...\n')

    // List all calendars
    const response = await calendarClient.calendarList.list()
    const calendars = response.data.items || []

    if (calendars.length === 0) {
      console.log('No calendars found.')
      return
    }

    console.log(`Found ${calendars.length} calendar(s):\n`)
    console.log('─'.repeat(80))

    calendars.forEach((cal, index) => {
      console.log(`\n${index + 1}. ${cal.summary}`)
      console.log(`   ID: ${cal.id}`)
      console.log(`   Access Role: ${cal.accessRole}`)
      console.log(`   Time Zone: ${cal.timeZone}`)
      console.log(`   Primary: ${cal.primary || false}`)
      console.log(`   Selected: ${cal.selected || false}`)
      if (cal.description) {
        console.log(`   Description: ${cal.description}`)
      }
      console.log('─'.repeat(80))
    })

    // Find ORCACLUB calendar
    const orcaCalendar = calendars.find(cal =>
      cal.summary?.toLowerCase().includes('orcaclub') ||
      cal.summary?.toLowerCase().includes('orca club')
    )

    if (orcaCalendar) {
      console.log('\n✅ Found ORCACLUB calendar!')
      console.log(`\nTo use this calendar, update your .env.local file:`)
      console.log(`\nGOOGLE_CALENDAR_ID=${orcaCalendar.id}`)
      console.log(`\nCurrent calendar in .env.local: ${process.env.GOOGLE_CALENDAR_ID || 'not set'}`)
    } else {
      console.log('\n⚠️  No calendar found with "ORCACLUB" in the name.')
      console.log('\nIf you need to create a new calendar named "ORCACLUB":')
      console.log('1. Go to https://calendar.google.com')
      console.log('2. Click the "+" next to "Other calendars"')
      console.log('3. Select "Create new calendar"')
      console.log('4. Name it "ORCACLUB" and save')
      console.log('5. Run this script again to get the calendar ID')
    }

  } catch (error) {
    console.error('Error listing calendars:', error)
    if (error instanceof Error) {
      console.error('Details:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
listCalendars()
