import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubmitForm } from "@/components/submit-form"

export default async function SubmitPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/submit")
    }

    return <SubmitForm />
}
