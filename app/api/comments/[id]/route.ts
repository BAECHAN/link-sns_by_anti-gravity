import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (comment.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.comment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COMMENT_DELETE]", error);
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
        const { content } = body;

        const comment = await prisma.comment.findUnique({
            where: { id },
        });

        if (!comment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (comment.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id },
            data: {
                content,
            },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error("[COMMENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
