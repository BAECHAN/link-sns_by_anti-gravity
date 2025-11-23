"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X, RotateCcw } from "lucide-react"
import { useState } from "react"

const CATEGORIES = ["백엔드", "프론트엔드", "AI", "디자인", "DevOps", "모바일", "데이터"]

export function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchInput, setSearchInput] = useState(searchParams.get("q") || "")
    const [showShortcuts, setShowShortcuts] = useState(false)

    const hasActiveFilters =
        (searchParams.get("sort") || "latest") !== "latest" ||
        (searchParams.get("period") || "all") !== "all" ||
        (searchParams.get("category") || "all") !== "all" ||
        searchParams.get("filter") === "bookmarked" ||
        searchInput !== ""

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            if (e.key === "n" || e.key === "N") {
                e.preventDefault()
                router.push("/submit")
            } else if (e.key === "?") {
                e.preventDefault()
                setShowShortcuts(!showShortcuts)
            }
        }

        window.addEventListener("keydown", handleKeyPress)
        return () => window.removeEventListener("keydown", handleKeyPress)
    }, [router, showShortcuts])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== (searchParams.get("q") || "")) {
                updateParams("q", searchInput)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchInput, searchParams])

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (key === "category" && value === "all") {
            params.delete(key)
        } else if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/?${params.toString()}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams("q", searchInput)
    }

    return (
        <>
            <div className="flex flex-col gap-4 p-3 md:p-4 bg-card rounded-lg border">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search-input"
                            placeholder="링크 검색... ('/')"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {searchInput && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setSearchInput("")
                                    updateParams("q", "")
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit" className="hidden md:inline-flex">검색</Button>
                </form>

                <div className="flex flex-wrap gap-2">
                    <Select
                        value={searchParams.get("sort") || "latest"}
                        onValueChange={(value) => updateParams("sort", value)}
                    >
                        <SelectTrigger className="w-[110px] md:w-[140px]">
                            <SelectValue placeholder="정렬" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">최신순</SelectItem>
                            <SelectItem value="views">조회순</SelectItem>
                            <SelectItem value="reactions">인기순</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={searchParams.get("period") || "all"}
                        onValueChange={(value) => updateParams("period", value)}
                    >
                        <SelectTrigger className="w-[110px] md:w-[140px]">
                            <SelectValue placeholder="기간" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 기간</SelectItem>
                            <SelectItem value="3days">최근 3일</SelectItem>
                            <SelectItem value="7days">최근 1주</SelectItem>
                            <SelectItem value="30days">최근 1개월</SelectItem>
                            <SelectItem value="1year">최근 1년</SelectItem>
                            <SelectItem value="3years">최근 3년</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant={searchParams.get("filter") === "bookmarked" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            const currentFilter = searchParams.get("filter")
                            if (currentFilter === "bookmarked") {
                                updateParams("filter", "")
                            } else {
                                updateParams("filter", "bookmarked")
                            }
                        }}
                        className="h-9"
                    >
                        북마크만
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSearchInput("")
                                router.push("/")
                            }}
                            title="필터 초기화"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    {CATEGORIES.map((cat) => {
                        const isSelected = searchInput.includes(`@${cat}`)
                        return (
                            <Button
                                key={cat}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    let newSearch = searchInput
                                    const tag = `@${cat}`
                                    if (isSelected) {
                                        newSearch = newSearch.replace(tag, "").trim()
                                    } else {
                                        newSearch = `${newSearch} ${tag}`.trim()
                                    }
                                    setSearchInput(newSearch)
                                    // Immediate search on badge click
                                    updateParams("q", newSearch)
                                }}
                                className="rounded-full text-xs h-7"
                            >
                                {cat}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-card p-6 rounded-lg border max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">⌨️ 키보드 단축키</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">N</kbd>
                                <span>새 글 작성</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">/</kbd>
                                <span>검색</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">?</kbd>
                                <span>단축키 보기</span>
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => setShowShortcuts(false)}>닫기</Button>
                    </div>
                </div>
            )}
        </>
    )
}
