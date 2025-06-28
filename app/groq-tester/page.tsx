import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { GroqTester } from "@/components/groq-tester"

export default function GroqTesterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Chat</span>
            </Button>
          </Link>
        </div>
        <GroqTester />
      </div>
    </div>
  )
} 