"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, ThumbsUp, Flame, Lightbulb, Laugh, Bookmark, MoreVertical, Pencil, Trash, ExternalLink, Eye, Copy, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface PostCardProps {
    post: any
    currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
    const [optimisticReactions, setOptimisticReactions] = useState(post._count?.reactions || 0)
    const [isBookmarked, setIsBookmarked] = useState(post.bookmarks?.length > 0)
    const [aiSummary, setAiSummary] = useState(post.aiSummary)
    const [tags, setTags] = useState(post.tags)
    const router = useRouter()

    // Poll for AI summary if it's missing
    useEffect(() => {
        if (aiSummary) return

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/posts/${post.id}`)
                if (res.ok) {
                    const updatedPost = await res.json()
                    if (updatedPost.aiSummary) {
                        setAiSummary(updatedPost.aiSummary)
                        setTags(updatedPost.tags)
                        clearInterval(interval)
                        router.refresh() // Optional: refresh to ensure server data is consistent
                    }
                }
            } catch (error) {
                console.error("Polling error:", error)
            }
        }, 3000)

        // Stop polling after 60 seconds to save resources
        const timeout = setTimeout(() => clearInterval(interval), 60000)

        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [aiSummary, post.id, router])

    const handleReaction = async (type: string) => {
        if (!currentUserId) return

        setOptimisticReactions((prev: number) => prev + 1)

        try {
            await fetch("/api/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id, type }),
            })
        } catch (error) {
            setOptimisticReactions((prev: number) => prev - 1)
        }
    }

    const handleBookmark = async () => {
        if (!currentUserId) return

        const previousState = isBookmarked
        setIsBookmarked(!previousState)

        try {
            const res = await fetch(`/api/posts/${post.id}/bookmark`, {
                method: "POST",
            })
            if (!res.ok) throw new Error()
        } catch (error) {
            setIsBookmarked(previousState)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return

        try {
            const res = await fetch(`/api/posts/${post.id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                router.refresh()
                // If on detail page, redirect to home? 
                // But PostCard is used in list and detail.
                // If in list, refresh removes it.
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/post/${post.id}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard')
        } catch (error) {
            console.error('Copy failed', error)
            toast.error('Failed to copy link')
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
                <div className="flex flex-col items-center p-4 gap-2 bg-muted/20 w-16">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleReaction("THUMBS_UP")}
                    >
                        <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold">{optimisticReactions}</span>
                </div>

                <div className="flex-1">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={post.user?.image || ""} />
                                    <AvatarFallback>{post.user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <span>{post.user?.name}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            </div>
                            <Link href={`/post/${post.id}`} className="hover:underline">
                                <h3 className="font-bold text-lg leading-tight">{post.title}</h3>
                            </Link>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${isBookmarked ? "text-yellow-500" : "text-muted-foreground"}`}
                                onClick={handleBookmark}
                            >
                                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={handleCopyLink}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>

                            {currentUserId === post.userId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => alert("Edit functionality coming soon!")}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                        {post.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {post.description}
                            </p>
                        )}

                        {aiSummary && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">AI 요약</span>
                                </div>
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    {aiSummary}
                                </p>
                            </div>
                        )}

                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 group border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                        >
                            {post.ogImage && (
                                <div className="relative h-48 w-full overflow-hidden bg-muted">
                                    <img
                                        src={post.ogImage}
                                        alt={post.title}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-3 bg-muted/30 flex items-center justify-between group-hover:bg-muted/50 transition-colors">
                                <span className="text-sm text-muted-foreground truncate flex-1 pr-4">
                                    {post.url}
                                </span>
                                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                    Visit Website
                                    <ExternalLink className="h-3 w-3" />
                                </div>
                            </div>
                        </a>

                        {post.categories && post.categories.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-2">
                                {post.categories.split(',').filter(Boolean).map((category: string) => (
                                    <Badge key={category} variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                            {tags.split(',').filter(Boolean).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex gap-4">
                        <Link href={`/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                {post._count?.comments || 0} Comments
                            </Button>
                        </Link>



                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReaction("FIRE")}>
                                <Flame className="h-4 w-4 text-orange-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReaction("IDEA")}>
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReaction("LAUGH")}>
                                <Laugh className="h-4 w-4 text-blue-500" />
                            </Button>
                        </div>

                        <div className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                            <Eye className="h-3 w-3" />
                            <span>{post.viewCount || 0}</span>
                        </div>
                    </CardFooter>
                </div>
            </div>
        </Card>
    )
}

