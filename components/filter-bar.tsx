"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Keyboard } from "lucide-react"
import { useState } from "react"

const CATEGORIES = ["백엔드", "프론트엔드", "AI", "디자인", "DevOps", "모바일", "데이터"]

export function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchInput, setSearchInput] = useState(searchParams.get("q") || "")
    const [showShortcuts, setShowShortcuts] = useState(false)

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
            } else if (e.key === "s" || e.key === "S" || e.key === "/") {
                e.preventDefault()
                document.getElementById("search-input")?.focus()
            } else if (e.key === "?") {
                e.preventDefault()
                setShowShortcuts(!showShortcuts)
            }
        }

        window.addEventListener("keydown", handleKeyPress)
        return () => window.removeEventListener("keydown", handleKeyPress)
    }, [router, showShortcuts])

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
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
            <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search-input"
                            placeholder="Search links... (Press 'S' or '/')"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>

                <div className="flex flex-wrap gap-2">
                    <Select
                        value={searchParams.get("sort") || "latest"}
                        onValueChange={(value) => updateParams("sort", value)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">Latest</SelectItem>
                            <SelectItem value="views">Most Viewed</SelectItem>
                            <SelectItem value="reactions">Most Popular</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={searchParams.get("period") || "all"}
                        onValueChange={(value) => updateParams("period", value)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="3days">Last 3 Days</SelectItem>
                            <SelectItem value="7days">Last Week</SelectItem>
                            <SelectItem value="30days">Last Month</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={searchParams.get("category") || ""}
                        onValueChange={(value) => updateParams("category", value)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Categories</SelectItem>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        title="Keyboard shortcuts (?)"
                    >
                        <Keyboard className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-card p-6 rounded-lg border max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">⌨️ Keyboard Shortcuts</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">N</kbd>
                                <span>New post</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">S</kbd>
                                <span>Search</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">/</kbd>
                                <span>Search</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-muted rounded">?</kbd>
                                <span>Show shortcuts</span>
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => setShowShortcuts(false)}>Close</Button>
                    </div>
                </div>
            )}
        </>
    )
}
