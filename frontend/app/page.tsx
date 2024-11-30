import FileUploadInterface from '../components/FileUploadInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1B1B1B] flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <img src="/placeholder.svg?height=50&width=50" alt="Logo" className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold mb-8 text-white" style={{ fontFamily: 'LiHei Pro, sans-serif' }}>
        tin
      </h1>
      <FileUploadInterface />
    </main>
  )
}

