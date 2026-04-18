"use client";

import { LogOut, Moon, Sun, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/actions/auth.action";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleThemeToggle = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-secondary transition-colors shadow-sm"
            >
                <User className="w-5 h-5 text-foreground" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-card rounded-lg shadow-lg border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        Profile
                    </button>
                    <button
                        onClick={handleThemeToggle}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                        disabled={!mounted}
                    >
                        {mounted && resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}
