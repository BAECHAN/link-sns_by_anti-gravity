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
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)

    const take = parseInt(searchParams.get("take") || "10")
    const skip = parseInt(searchParams.get("skip") || "0")
    const sort = searchParams.get("sort") || "latest"
    const period = searchParams.get("period") || "all"
    const category = searchParams.get("category") || ""
    const searchQuery = searchParams.get("q") || ""
    const filter = searchParams.get("filter") || ""

    // Build where clause
    const where: any = {}

    // Parse search query for tags (e.g., @Backend)
    let textSearch = searchQuery
    const tags: string[] = []

    if (searchQuery) {
        const tagRegex = /@(\S+)/g
        const matches = searchQuery.match(tagRegex)
        if (matches) {
            matches.forEach(match => {
                tags.push(match.substring(1)) // Remove @
            })
            // Remove tags from text search
            textSearch = searchQuery.replace(tagRegex, "").trim()
        }
    }

    if (textSearch) {
        where.OR = [
            { title: { contains: textSearch } },
            { description: { contains: textSearch } },
            { tags: { contains: textSearch } },
        ]
    }

    // Filter by category (from URL param OR parsed tags)
    const categoriesToFilter = [...tags]
    if (category && category !== "all") {
        categoriesToFilter.push(category)
    }

    if (categoriesToFilter.length > 0) {
        const categoryConditions = categoriesToFilter.map(cat => ({
            categories: {
                contains: cat
            }
        }))

        if (where.OR) {
            where.AND = [
                { OR: where.OR },
                { OR: categoryConditions }
            ]
            delete where.OR
        } else {
            where.OR = categoryConditions
        }
    }

    if (period !== "all") {
        const now = new Date()
        let daysAgo = 30
        if (period === "3days") daysAgo = 3
        else if (period === "7days") daysAgo = 7
        else if (period === "30days") daysAgo = 30
        else if (period === "1year") daysAgo = 365
        else if (period === "3years") daysAgo = 365 * 3

        const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        where.createdAt = {
            gte: startDate
        }
    }

    if (filter === "bookmarked" && session?.user?.id) {
        where.bookmarks = {
            some: {
                userId: session.user.id
            }
        }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" }
    if (sort === "views") {
        orderBy = { viewCount: "desc" }
    } else if (sort === "reactions") {
        orderBy = { reactions: { _count: "desc" } }
    }

    try {
        const posts = await prisma.post.findMany({
            take,
            skip,
            where,
            orderBy,
            include: {
                user: true,
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    }
                },
                bookmarks: {
                    where: {
                        userId: session?.user?.id,
                    },
                },
            },
        })

        return NextResponse.json(posts)
    } catch (error) {
        console.error("Error fetching posts:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
