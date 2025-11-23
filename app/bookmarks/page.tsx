import { prisma } from "@/lib/prisma"
import { PostCard } from "@/components/post-card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function BookmarksPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    const posts = await prisma.post.findMany({
        where: {
            bookmarks: {
                some: {
                    userId: session.user.id
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        },
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
                    userId: session.user.id,
                },
            },
        },
    })

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">My Bookmarks</h1>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={session.user.id} />
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No bookmarked links found.
                    </div>
                )}
            </div>
        </div>
    )
}
