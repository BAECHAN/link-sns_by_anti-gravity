"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CommentFormProps {
    postId: string
    userImage?: string | null
}

export function CommentForm({ postId, userImage }: CommentFormProps) {
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsLoading(true)
        try {
            await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, content }),
            })
            setContent("")
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={userImage || ""} />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 gap-2 flex flex-col">
                <Textarea
                    placeholder="Add a comment..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[80px]"
                />
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isLoading || !content.trim()}>
                        {isLoading ? "Posting..." : "Post Comment"}
                    </Button>
                </div>
            </div>
        </form>
    )
}
