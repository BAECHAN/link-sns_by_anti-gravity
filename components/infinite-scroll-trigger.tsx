"use client"

import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { PostCard } from "@/components/post-card"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

interface InfiniteScrollTriggerProps {
    initialPostCount: number
    currentUserId?: string
}

export function InfiniteScrollTrigger({ initialPostCount, currentUserId }: InfiniteScrollTriggerProps) {
    const { ref, inView } = useInView()
    const [posts, setPosts] = useState<any[]>([])
    const [offset, setOffset] = useState(initialPostCount)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const searchParams = useSearchParams()

    // Reset state when search params change
    useEffect(() => {
        setPosts([])
        setOffset(initialPostCount)
        setHasMore(true)
    }, [searchParams, initialPostCount])

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            loadMorePosts()
        }
    }, [inView, hasMore, isLoading])

    const loadMorePosts = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams(searchParams.toString())
            params.set("skip", offset.toString())
            params.set("take", "10")

            const res = await fetch(`/api/posts?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch posts")

            const newPosts = await res.json()

            if (newPosts.length < 10) {
                setHasMore(false)
            }

            setPosts((prev) => [...prev, ...newPosts])
            setOffset((prev) => prev + newPosts.length)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}

            {hasMore && (
                <div ref={ref} className="flex justify-center p-4">
                    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                </div>
            )}
        </>
    )
}
