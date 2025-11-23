import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { PostCard } from "@/components/post-card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { CommentForm } from "@/components/comment-form"
import { CommentItem } from "@/components/comment-item"

export const dynamic = 'force-dynamic'

interface PostPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Increment view count
    await prisma.post.update({
        where: { id },
        data: {
            viewCount: {
                increment: 1
            }
        }
    })

    const post = await prisma.post.findUnique({
        where: { id },
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
                    userId: session?.user?.id ?? "",
                },
            },
            comments: {
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    user: true
                }
            }
        }
    }) as any

    if (!post) {
        notFound()
    }

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6">
            <div className="lg:col-span-2 space-y-8">
                <PostCard post={post} currentUserId={session?.user?.id} />

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Write a Comment</h3>
                    <CommentForm postId={post.id} userImage={session?.user?.image} />
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold">Comments ({post.comments.length})</h3>

                <div className="space-y-4 lg:h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2">
                    {post.comments.map((comment: any) => (
                        <CommentItem key={comment.id} comment={comment} currentUserId={session?.user?.id} />
                    ))}
                    {post.comments.length === 0 && (
                        <p className="text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts!</p>
                    )}
                </div>
            </div>
        </div>
    )
}
