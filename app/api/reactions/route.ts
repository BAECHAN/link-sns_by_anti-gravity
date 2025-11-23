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
        const { postId, type } = await req.json()

        if (!postId || !type) {
            return new NextResponse("Missing fields", { status: 400 })
        }

        // Upsert reaction (change type if exists, or create new)
        // But wait, schema says unique [postId, userId].
        // So we should upsert.

        const reaction = await prisma.reaction.upsert({
            where: {
                postId_userId: {
                    postId,
                    userId: session.user.id,
                },
            },
            update: {
                type,
            },
            create: {
                postId,
                userId: session.user.id,
                type,
            },
        })

        return NextResponse.json(reaction)
    } catch (error) {
        console.error("Error reacting:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
