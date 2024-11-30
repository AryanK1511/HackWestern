'use client'

import { useState } from 'react'
import ToggleSwitch from './ToggleSwitch'
import FileUpload from './FileUpload'
import CodePaste from './CodePaste'

export default function FileUploadInterface() {
  const [isFileUpload, setIsFileUpload] = useState(true)
  const [isReadyToUpload, setIsReadyToUpload] = useState(false)

  const handleToggle = (value: boolean) => {
    setIsFileUpload(value)
    setIsReadyToUpload(false)
  }

  const handleReadyToUpload = () => {
    setIsReadyToUpload(true)
  }

  return (
    <div className="bg-[#2B2B2B] p-8 rounded-lg w-full max-w-2xl relative">
      <div className="absolute -top-4 -left-4">
        <ToggleSwitch isFileUpload={isFileUpload} onToggle={handleToggle} />
      </div>
      {isFileUpload ? (
        <FileUpload onReady={handleReadyToUpload} />
      ) : (
        <CodePaste onReady={handleReadyToUpload} />
      )}
      {isReadyToUpload && (
        <button className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors mx-auto block">
          Upload
        </button>
      )}
    </div>
  )
}

