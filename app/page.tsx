import { prisma } from "@/lib/prisma"
import { PostCard } from "@/components/post-card"
import { FilterBar } from "@/components/filter-bar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger"

export const dynamic = 'force-dynamic'

interface HomeProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  // Await searchParams in Next.js 15+
  const params = await searchParams
  const sort = (params.sort as string) || "latest"
  const period = (params.period as string) || "all"
  const category = (params.category as string) || ""
  const searchQuery = (params.q as string) || ""

  // Build where clause for filtering
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

  // Search by title, description, or tags
  if (textSearch) {
    where.OR = [
      { title: { contains: textSearch } },
      { description: { contains: textSearch } },
      { tags: { contains: textSearch } },
    ]
  }

  // Filter by category (from URL param OR parsed tags)
  const categoriesToFilter = [...tags]
  if (category) {
    categoriesToFilter.push(category)
  }

  if (categoriesToFilter.length > 0) {
    // If multiple categories, we want posts that match ANY of them
    // But since categories is a string, we need OR conditions for each
    const categoryConditions = categoriesToFilter.map(cat => ({
      categories: {
        contains: cat
      }
    }))

    if (where.OR) {
      // If we already have OR for text search, we need to combine them carefully
      // (Text Search) AND (Category A OR Category B)
      where.AND = [
        { OR: where.OR },
        { OR: categoryConditions }
      ]
      delete where.OR
    } else {
      where.OR = categoryConditions
    }
  }

  // Filter by period
  if (period !== "all") {
    const now = new Date()
    const daysAgo = period === "3days" ? 3 : period === "7days" ? 7 : 30
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    where.createdAt = {
      gte: startDate
    }
  }

  // Filter by bookmarks
  if (params.filter === "bookmarked" && session?.user?.id) {
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

  const posts = await prisma.post.findMany({
    take: 10,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent Links</h1>
        <Link href="/submit">
          <Button>Submit Link</Button>
        </Link>
      </div>

      <FilterBar />

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={session?.user?.id} />
        ))}
        <InfiniteScrollTrigger initialPostCount={posts.length} currentUserId={session?.user?.id} />

        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No links found. Try adjusting your filters!
          </div>
        )}
      </div>
    </div>
  )
}
