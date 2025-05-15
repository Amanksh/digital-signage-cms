import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const content = formData.get("content") as string

    if (!content) {
      return NextResponse.json({ error: "No HTML content provided" }, { status: 400 })
    }

    // In a real application, you would:
    // 1. Validate and sanitize the HTML content
    // 2. Store the content in your database

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return success response with asset details
    return NextResponse.json({
      success: true,
      asset: {
        id: `html-${Date.now()}`,
        name,
        type: "html",
        content,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating HTML asset:", error)
    return NextResponse.json({ error: "Failed to create HTML asset" }, { status: 500 })
  }
}
