'use client'

import { useState } from 'react'

interface CodePasteProps {
  onReady: () => void
}

export default function CodePaste({ onReady }: CodePasteProps) {
  const [code, setCode] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    if (e.target.value.trim() !== '') {
      onReady()
    }
  }

  return (
    <textarea
      className="w-full h-64 bg-[#3B3B3B] text-white p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Paste your code here..."
      value={code}
      onChange={handleChange}
    />
  )
}

