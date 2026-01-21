#!/usr/bin/env bun
/**
 * Diagnostic script to check Google Calendar environment configuration
 * Run: bun run scripts/diagnose-google-calendar.ts
 */

console.log('🔍 Diagnosing Google Calendar Configuration\n')

// Check if environment variable exists
const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const calendarId = process.env.GOOGLE_CALENDAR_ID
const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL

console.log('1. Environment Variables Check:')
console.log('   GOOGLE_SERVICE_ACCOUNT_KEY:', credentials ? '✅ Set' : '❌ Not set')
console.log('   GOOGLE_CALENDAR_ID:', calendarId || '⚠️  Not set (will use "primary")')
console.log('   GOOGLE_DELEGATED_USER_EMAIL:', delegatedUser || '⚠️  Not set (domain-wide delegation disabled)')

if (!credentials) {
  console.log('\n❌ GOOGLE_SERVICE_ACCOUNT_KEY is not set!')
  console.log('\n💡 To fix:')
  console.log('   1. Create a .env.local file if it doesn\'t exist')
  console.log('   2. Add: GOOGLE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'')
  console.log('   3. Make sure to use single quotes around the JSON string')
  process.exit(1)
}

console.log('\n2. Credential String Analysis:')
console.log('   Length:', credentials.length, 'characters')
console.log('   First 10 chars:', JSON.stringify(credentials.substring(0, 10)))
console.log('   Last 10 chars:', JSON.stringify(credentials.substring(credentials.length - 10)))
console.log('   Has leading whitespace:', credentials !== credentials.trimStart() ? '⚠️  Yes' : '✅ No')
console.log('   Has trailing whitespace:', credentials !== credentials.trimEnd() ? '⚠️  Yes' : '✅ No')

// Try to parse JSON
console.log('\n3. JSON Parsing Test:')
try {
  const parsed = JSON.parse(credentials)
  console.log('   ✅ Valid JSON!')

  // Check required fields
  console.log('\n4. Required Fields Check:')
  const requiredFields = ['type', 'project_id', 'private_key', 'client_email', 'client_id']
  let allFieldsPresent = true

  for (const field of requiredFields) {
    const isPresent = field in parsed && parsed[field]
    console.log(`   ${field}:`, isPresent ? '✅' : '❌')
    if (!isPresent) allFieldsPresent = false
  }

  if (allFieldsPresent) {
    console.log('\n✅ All required fields present!')
    console.log('\n5. Credential Details:')
    console.log('   Type:', parsed.type)
    console.log('   Project ID:', parsed.project_id)
    console.log('   Client Email:', parsed.client_email)
    console.log('   Private Key:', parsed.private_key ? `${parsed.private_key.substring(0, 50)}...` : '❌ Missing')
  } else {
    console.log('\n❌ Some required fields are missing!')
  }

} catch (error) {
  console.log('   ❌ Invalid JSON!')
  console.log('\n   Error:', error instanceof Error ? error.message : 'Unknown error')

  // Try to identify the issue
  console.log('\n💡 Common Issues:')

  if (credentials.length === 0) {
    console.log('   - The environment variable is empty')
  } else if (credentials.trim().length === 0) {
    console.log('   - The environment variable contains only whitespace')
  } else if (!credentials.startsWith('{')) {
    console.log('   - JSON should start with { but starts with:', JSON.stringify(credentials.charAt(0)))
  } else if (!credentials.endsWith('}')) {
    console.log('   - JSON should end with } but ends with:', JSON.stringify(credentials.charAt(credentials.length - 1)))
  } else {
    console.log('   - Malformed JSON - check for missing quotes, commas, or escaped characters')
    console.log('   - Try validating your JSON at: https://jsonlint.com/')
  }

  console.log('\n   First 200 characters of credential string:')
  console.log('  ', JSON.stringify(credentials.substring(0, 200)))

  process.exit(1)
}

console.log('\n🎉 Google Calendar configuration looks good!')
console.log('\n💡 Next steps:')
console.log('   - Restart your dev server: bun run bun:dev')
console.log('   - Test the booking API: /api/booking/available-slots?date=2026-01-22')
