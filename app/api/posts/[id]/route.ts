import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                user: true,
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    }
                },
                bookmarks: true, // Include bookmarks for checking status
            }
        }) as any;

        if (!post) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("[POST_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (post.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;
        const body = await req.json();
        const { title, description, tags, categories } = body;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (post.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                description,
                tags,
                categories,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("[POST_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
