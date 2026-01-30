import { ReactNode } from 'react'
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import UserMenu from "@/components/UserMenu";

const RootLayout = async ({ children }: { children: ReactNode }) => {

    const isUserAuthenticated = await isAuthenticated();

    if (!isUserAuthenticated) redirect('/sign-in');
    return (
        <div className="root-layout" >
            <nav className="flex justify-between items-center w-full px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="logo" width={38} height={32} />
                    <h2 className="text-primary-100 font-bold text-lg">PrepWise</h2>
                </Link>
                <UserMenu />
            </nav>
            {children}
        </div>
    )
}
export default RootLayout
