"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { MoreVertical, Pencil, Trash, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface CommentItemProps {
    comment: any
    currentUserId?: string
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(comment.content)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm("Delete this comment?")) return

        try {
            const res = await fetch(`/api/comments/${comment.id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async () => {
        if (!content.trim()) return
        setIsLoading(true)

        try {
            const res = await fetch(`/api/comments/${comment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            })
            if (res.ok) {
                setIsEditing(false)
                router.refresh()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex gap-3 p-4 rounded-lg bg-muted/30 group">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.image || ""} />
                <AvatarFallback>{comment.user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{comment.user.name}</span>
                        <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    {currentUserId === comment.userId && !isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                    <Trash className="mr-2 h-3 w-3" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[60px]"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
                                <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                )}
            </div>
        </div>
    )
}
