"use client";
import { useClerk } from "@clerk/nextjs";

export default function LoginButton() {
  const { openSignIn } = useClerk();

  return (
    <button 
      onClick={() => openSignIn({ mode: 'modal' })}
      className="pixel-button scale-75 whitespace-nowrap cursor-pointer"
    >
      Login
    </button>
  );
}
