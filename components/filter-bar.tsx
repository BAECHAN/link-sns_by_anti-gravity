"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["백엔드", "프론트엔드", "AI", "디자인", "DevOps", "모바일", "데이터"]
const PERIODS = [
    { value: "all", label: "전체" },
    { value: "3days", label: "3일" },
    { value: "7days", label: "7일" },
    { value: "30days", label: "30일" },
]
const SORT_OPTIONS = [
    { value: "latest", label: "최신순" },
    { value: "views", label: "조회순" },
    { value: "reactions", label: "좋아요순" },
]

export function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentSort = searchParams.get("sort") || "latest"
    const currentPeriod = searchParams.get("period") || "all"
    const currentCategory = searchParams.get("category") || ""

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/?${params.toString()}`)
    }

    const toggleCategory = (category: string) => {
        updateFilter("category", currentCategory === category ? "" : category)
    }

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
                {/* Sort */}
                <Select value={currentSort} onValueChange={(value) => updateFilter("sort", value)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Period */}
                <Select value={currentPeriod} onValueChange={(value) => updateFilter("period", value)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                                {period.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={searchParams.get("filter") === "bookmarked" ? "default" : "outline"}
                    onClick={() => updateFilter("filter", searchParams.get("filter") === "bookmarked" ? "" : "bookmarked")}
                    className="h-10"
                >
                    <Bookmark className="mr-2 h-4 w-4" />
                    북마크
                </Button>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                    <Badge
                        key={category}
                        variant={currentCategory === category ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleCategory(category)}
                    >
                        {category}
                        {currentCategory === category && (
                            <X className="ml-1 h-3 w-3" />
                        )}
                    </Badge>
                ))}
            </div>
        </div>
    )
}
