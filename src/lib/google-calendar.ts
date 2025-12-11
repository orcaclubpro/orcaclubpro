import { google } from 'googleapis'
import type { calendar_v3 } from 'googleapis'

interface CalendarEvent {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  attendeeEmail: string
  attendeeName: string
  timeZone?: string
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null
  private calendarId: string

  constructor() {
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
    this.initializeCalendar()
  }

  private initializeCalendar() {
    try {
      // Parse the service account credentials from environment variable
      const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      const delegatedUser = process.env.GOOGLE_DELEGATED_USER_EMAIL

      if (!credentials) {
        console.warn('Google Calendar: No service account credentials found. Calendar integration disabled.')
        return
      }

      const parsedCredentials = JSON.parse(credentials)

      // Create auth client with service account
      const auth = new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
        // Use domain-wide delegation to impersonate a user (required for sending invites)
        clientOptions: delegatedUser ? {
          subject: delegatedUser,
        } : undefined,
      })

      // Initialize calendar client
      this.calendar = google.calendar({ version: 'v3', auth })

      console.log('Google Calendar service initialized successfully' + (delegatedUser ? ` (impersonating ${delegatedUser})` : ''))
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error)
      this.calendar = null
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData: CalendarEvent): Promise<string | null> {
    if (!this.calendar) {
      console.warn('Google Calendar not initialized. Skipping event creation.')
      return null
    }

    try {
      const event: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'America/Los_Angeles',
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'America/Los_Angeles',
        },
        attendees: [
          {
            email: eventData.attendeeEmail,
            displayName: eventData.attendeeName,
            responseStatus: 'needsAction',
          },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 }, // 1 hour before (popup only, no email)
          ],
        },
        conferenceData: {
          createRequest: {
            requestId: `booking-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      }

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        conferenceDataVersion: 1, // Required for Google Meet link
        sendUpdates: 'all', // Send email invitations to attendees
      })

      console.log('Calendar event created:', response.data.id)
      return response.data.htmlLink || response.data.id || null
    } catch (error) {
      console.error('Failed to create calendar event:', error)
      return null
    }
  }

  /**
   * Check if a time slot is available
   */
  async isTimeSlotAvailable(
    startDateTime: string,
    endDateTime: string
  ): Promise<boolean> {
    if (!this.calendar) {
      return true // If calendar not initialized, assume available
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startDateTime,
        timeMax: endDateTime,
        singleEvents: true,
        orderBy: 'startTime',
      })

      // If there are any events in this time range, slot is not available
      return (response.data.items?.length || 0) === 0
    } catch (error) {
      console.error('Failed to check calendar availability:', error)
      return true // On error, assume available to not block bookings
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(maxResults: number = 10): Promise<calendar_v3.Schema$Event[]> {
    if (!this.calendar) {
      return []
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      return response.data.items || []
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error)
      return []
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<boolean> {
    if (!this.calendar) {
      return false
    }

    try {
      const event: Partial<calendar_v3.Schema$Event> = {}

      if (updates.summary) event.summary = updates.summary
      if (updates.description) event.description = updates.description
      if (updates.startDateTime) {
        event.start = {
          dateTime: updates.startDateTime,
          timeZone: updates.timeZone || 'America/Los_Angeles',
        }
      }
      if (updates.endDateTime) {
        event.end = {
          dateTime: updates.endDateTime,
          timeZone: updates.timeZone || 'America/Los_Angeles',
        }
      }

      await this.calendar.events.patch({
        calendarId: this.calendarId,
        eventId,
        requestBody: event,
        sendUpdates: 'all',
      })

      console.log('Calendar event updated:', eventId)
      return true
    } catch (error) {
      console.error('Failed to update calendar event:', error)
      return false
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.calendar) {
      return false
    }

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId,
        sendUpdates: 'all',
      })

      console.log('Calendar event deleted:', eventId)
      return true
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      return false
    }
  }
}

// Export singleton instance
export const googleCalendar = new GoogleCalendarService()
