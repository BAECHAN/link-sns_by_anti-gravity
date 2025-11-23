"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

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
            
            toast.success("링크가 공유되었습니다!")
            router.push("/")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("오류가 발생했습니다. 다시 시도해주세요.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center w-full py-8">
            <Card className="w-full max-w-2xl">
                <CardHeader className="p-6">
                    <CardTitle className="text-2xl">링크 공유하기</CardTitle>
                    <CardDescription>
                        팀원들과 공유하고 싶은 유용한 아티클이나 리소스의 URL을 입력하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com/amazing-article"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11"
                            />
                            <p className="text-sm text-muted-foreground">
                                자동으로 제목과 이미지를 가져오고 태그를 생성합니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label>관심 분야 (선택사항)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                                        >
                                            {category}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full h-11 text-base">
                            {isLoading ? "공유하는 중..." : "링크 공유하기"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
