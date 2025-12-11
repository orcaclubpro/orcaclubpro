"use client"

import React from 'react'
import Image from 'next/image'

export default function OrcaClubIcon() {
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <Image
        src="/orcaclubpro.png"
        alt="ORCACLUB"
        width={32}
        height={32}
        className="w-8 h-8 object-contain"
      />
    </div>
  )
}
