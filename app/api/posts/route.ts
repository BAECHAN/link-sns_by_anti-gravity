import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { url, categories = [] } = await req.json()

        if (!url) {
            return new NextResponse("URL is required", { status: 400 })
        }

        // Fetch OG metadata
        let title = ""
        let description = ""
        let ogImage = ""
        let tags: string[] = []
        let aiSummary = ""

        try {
            const response = await fetch(url)
            const html = await response.text()
            const $ = cheerio.load(html)

            title = $('meta[property="og:title"]').attr('content') || $('title').text() || url
            description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ""
            ogImage = $('meta[property="og:image"]').attr('content') || ""

            // Simple tag extraction (domain name as tag)
            try {
                const domain = new URL(url).hostname.replace('www.', '')
                tags.push(domain)
            } catch (e) { }

        } catch (error) {
            console.error("Error fetching OG data:", error)
            // Fallback if fetching fails
            title = url
        }

        const post = await prisma.post.create({
            data: {
                url,
                title,
                description,
                ogImage,
                tags: tags.join(','),
                categories: Array.isArray(categories) ? categories.join(',') : '',
                aiSummary,
                userId: session.user.id,
            },
        })

        return NextResponse.json(post)
    } catch (error) {
        console.error("Error creating post:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: true,
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    }
                }
            },
        })

        return NextResponse.json(posts)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
