import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { postId, content } = await req.json()

        if (!postId || !content) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        const comment = await prisma.comment.create({
            data: {
                postId,
                content,
                userId: session.user.id,
            },
            include: {
                user: true,
            }
        })

        return NextResponse.json(comment)
    } catch (error) {
        console.error("Error commenting:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
