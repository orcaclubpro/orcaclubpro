import { NextRequest, NextResponse } from "next/server"
import { googleCalendar } from "@/lib/google-calendar"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Check if date is in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      return NextResponse.json(
        { error: "Cannot book slots in the past" },
        { status: 400 }
      )
    }

    // Optional parameters with defaults
    const duration = parseInt(searchParams.get("duration") || "60")
    const startHour = parseInt(searchParams.get("startHour") || "9")
    const endHour = parseInt(searchParams.get("endHour") || "17")
    const timeZone = searchParams.get("timeZone") || "America/Los_Angeles"

    // Validate duration
    if (duration < 15 || duration > 240) {
      return NextResponse.json(
        { error: "Duration must be between 15 and 240 minutes" },
        { status: 400 }
      )
    }

    // Validate business hours
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 || startHour >= endHour) {
      return NextResponse.json(
        { error: "Invalid business hours" },
        { status: 400 }
      )
    }

    // Get available slots from Google Calendar
    const availableSlots = await googleCalendar.getAvailableSlots(
      date,
      duration,
      startHour,
      endHour,
      timeZone
    )

    return NextResponse.json(
      {
        success: true,
        date,
        timeZone,
        slots: availableSlots,
        count: availableSlots.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Available slots API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch available slots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
