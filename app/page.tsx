"use client";

import SignUpCard from "./_components/sign-up-card";
import SignInCard from "./_components/sign-in-card";
import { useState } from "react";

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(true);
  return (
    <>
      {isSignUp ? (
        <SignUpCard onSwitchToSignIn={() => setIsSignUp(false)} />
      ) : (
        <SignInCard onSwitchToSignUp={() => setIsSignUp(true)} />
      )}
    </>
  );
}
