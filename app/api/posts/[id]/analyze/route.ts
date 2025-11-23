import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id }
        })

        if (!post) {
            return new NextResponse("Post not found", { status: 404 })
        }

        const url = post.url
        let aiSummary = ""
        let tags: string[] = []

        // Fetch page content for AI analysis
        try {
            const response = await fetch(url)
            const html = await response.text()
            const $ = cheerio.load(html)

            // Extract text content from HTML
            const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)

            // Re-use existing title/desc if needed, or just use what's in DB
            const title = post.title
            const description = post.description || ""

            const apiKey = process.env.GEMINI_API_KEY

            // Only attempt AI generation if API key is configured and valid
            if (apiKey && apiKey !== 'your-api-key-here') {
                const { GoogleGenerativeAI } = await import('@google/generative-ai')
                const genAI = new GoogleGenerativeAI(apiKey)

                // Try multiple models in order of preference
                const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

                for (const modelName of modelsToTry) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName })

                        const prompt = `다음 웹페이지를 분석해주세요:

제목: ${title}
설명: ${description}
내용: ${textContent}

다음 형식으로 응답해주세요:
SUMMARY: [3-4문장으로 핵심 내용 요약]
TAGS: [관련 키워드 3-5개를 쉼표로 구분, 예: React,TypeScript,웹개발]`

                        const result = await model.generateContent(prompt)
                        const response = result.response.text()

                        // Parse response
                        const summaryMatch = response.match(/SUMMARY:\s*([\s\S]+?)(?=TAGS:|$)/)
                        const tagsMatch = response.match(/TAGS:\s*([\s\S]+?)$/)

                        if (summaryMatch) {
                            aiSummary = summaryMatch[1].trim()
                        }
                        if (tagsMatch) {
                            const aiTags = tagsMatch[1].trim().split(',').map(t => t.trim())
                            // Merge with existing tags, avoiding duplicates
                            const existingTags = post.tags ? post.tags.split(',') : []
                            const newTags = [...new Set([...existingTags, ...aiTags])]
                            tags = newTags
                        }

                        console.log(`AI content generated successfully using ${modelName}`)
                        break
                    } catch (modelError: any) {
                        console.log(`Failed with ${modelName}, trying next model...`)
                        if (modelName === modelsToTry[modelsToTry.length - 1]) {
                            throw modelError
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error in AI analysis:", error)
            return new NextResponse("Analysis Failed", { status: 500 })
        }

        // Update post with AI results
        if (aiSummary || tags.length > 0) {
            await prisma.post.update({
                where: { id },
                data: {
                    aiSummary: aiSummary || undefined,
                    tags: tags.length > 0 ? tags.join(',') : undefined
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error analyzing post:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
