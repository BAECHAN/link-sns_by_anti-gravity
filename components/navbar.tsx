"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Moon, Sun, Search } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
            params.set("q", searchQuery)
        } else {
            params.delete("q")
        }
        router.push(`/?${params.toString()}`)
    }

    // Global keyboard shortcut for search
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if typing in input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            if (e.key === "/") {
                e.preventDefault()
                // Prioritize FilterBar search, fall back to header search
                const contentSearch = document.getElementById("search-input")
                const headerSearch = document.getElementById("header-search-input")
                if (contentSearch) {
                    contentSearch.focus()
                } else if (headerSearch) {
                    headerSearch.focus()
                }
            }
        }

        window.addEventListener("keydown", handleKeyPress)
        return () => window.removeEventListener("keydown", handleKeyPress)
    }, [])

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-3 md:gap-6">
                    <Link href="/" className="flex items-center space-x-2 font-bold text-lg md:text-xl">
                        LinkSphere
                    </Link>
                    <div className="hidden md:flex gap-4">
                        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                            Feed
                        </Link>
                        <Link href="/submit" className="text-sm font-medium transition-colors hover:text-primary">
                            Submit
                        </Link>
                    </div>
                </div>

                {/* Search Bar - Hidden on mobile, shown on larger screens */}
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="header-search-input"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </form>


                <div className="flex items-center gap-1 md:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                            const html = document.documentElement
                            html.classList.toggle('dark')
                        }}
                    >
                        <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                                        <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => signOut()}>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={() => signIn()} size="sm">
                            Log in
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}
