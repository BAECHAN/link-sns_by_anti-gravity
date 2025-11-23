"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const CATEGORIES = [
    "백엔드",
    "프론트엔드",
    "AI",
    "디자인",
    "DevOps",
    "모바일",
    "데이터"
]

export function SubmitForm() {
    const [url, setUrl] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url,
                    categories: selectedCategories
                }),
            })

            if (!res.ok) {
                throw new Error("Failed to create post")
            }

            const post = await res.json()

            // Trigger AI analysis in background (don't await)
            fetch(`/api/posts/${post.id}/analyze`, {
                method: "POST"
            })

            router.push("/")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Share a Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com/amazing-article"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                We'll automatically fetch the title, image, and generate tags.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>직군 (선택사항)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {CATEGORIES.map((category) => (
                                    <div key={category} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category}
                                            checked={selectedCategories.includes(category)}
                                            onCheckedChange={() => toggleCategory(category)}
                                            disabled={isLoading}
                                        />
                                        <label
                                            htmlFor={category}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {category}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Sharing..." : "Share Link"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
