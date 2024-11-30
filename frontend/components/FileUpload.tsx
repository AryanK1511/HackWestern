'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onReady: () => void
}

export default function FileUpload({ onReady }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0])
    onReady()
  }, [onReady])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer ${
        isDragActive ? 'border-blue-500' : ''
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <p className="text-white">File selected: {file.name}</p>
      ) : (
        <>
          <p className="text-white mb-4">Drag and drop your file here, or click to select a file</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Browse Files
          </button>
        </>
      )}
    </div>
  )
}

