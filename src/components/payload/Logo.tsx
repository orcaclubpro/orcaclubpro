"use client"

import React from 'react'
import Image from 'next/image'

export default function OrcaClubLogo() {
  return (
    <div className="flex items-center justify-center py-8">
      <Image
        src="/orcaclubpro.png"
        alt="ORCACLUB Pro"
        width={160}
        height={160}
        className="w-32 h-32 object-contain transition-opacity duration-300 hover:opacity-80"
        priority
      />
    </div>
  )
}
