import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is exported from here
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: postId } = await params;
        const userId = session.user.id;

        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });

        if (existingBookmark) {
            await prisma.bookmark.delete({
                where: {
                    id: existingBookmark.id,
                },
            });
            return NextResponse.json({ bookmarked: false });
        } else {
            await prisma.bookmark.create({
                data: {
                    postId,
                    userId,
                },
            });
            return NextResponse.json({ bookmarked: true });
        }
    } catch (error) {
        console.error("[BOOKMARK_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
