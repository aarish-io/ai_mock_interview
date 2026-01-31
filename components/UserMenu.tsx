"use client";

import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut();
        toast.success("Logged out successfully");
        router.push("/sign-in");
    };

    const handleProfile = () => {
        toast.info("Profile page is in development");
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border hover:bg-gray-200 transition-colors"
            >
                <User className="w-5 h-5 text-gray-600" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}
