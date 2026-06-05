"use client";
import Link from "next/link";

export default function LoginButton() {
  return (
    <Link 
      href="/sign-in"
      className="pixel-button scale-75 whitespace-nowrap cursor-pointer"
    >
      Login
    </Link>
  );
}
