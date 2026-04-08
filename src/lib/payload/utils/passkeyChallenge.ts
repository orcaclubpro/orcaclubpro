/**
 * Passkey Challenge Storage
 * Stores WebAuthn challenges in HTTP-only cookies (single-use, 5-min TTL)
 */
import { NextRequest, NextResponse } from 'next/server'

export const CHALLENGE_COOKIE = 'passkey-challenge'
const CHALLENGE_TTL = 300 // 5 minutes

export function setChallengeCookie(response: NextResponse, challenge: string): void {
  response.cookies.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL,
  })
}

export function getChallenge(request: NextRequest): string | null {
  return request.cookies.get(CHALLENGE_COOKIE)?.value ?? null
}

export function clearChallengeCookie(response: NextResponse): void {
  response.cookies.set(CHALLENGE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
