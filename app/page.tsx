import { prisma } from "@/lib/prisma"
import { PostCard } from "@/components/post-card"
import { FilterBar } from "@/components/filter-bar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  // Search by title, description, or tags (SQLite doesn't support mode: 'insensitive')
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery } },
      { description: { contains: searchQuery } },
      { tags: { contains: searchQuery } },
    ]
  }

  // Filter by category
  if (category) {
    where.categories = {
      contains: category
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
          <Button>Share Link</Button>
        </Link>
      </div>

      <FilterBar />

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={session?.user?.id} />
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No links found. Try adjusting your filters!
          </div>
        )}
      </div>
    </div>
  )
}
