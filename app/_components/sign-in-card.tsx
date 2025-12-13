"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/utils/auth-client";

interface SignInCardProps {
  onSwitchToSignUp: () => void;
}

export default function SignInCard({ onSwitchToSignUp }: SignInCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/lobby",
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          router.push("/lobby");
        },
        onError: (ctx) => {
          setIsLoading(false);
          console.log(ctx.error);
          alert(ctx.error.message);
        },
      }
    );
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black'>
      <form onSubmit={handleSignIn} className='w-full max-w-md'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Jack Custom</CardTitle>
            <CardAction>
              <Button type='button' variant='link' onClick={onSwitchToSignUp}>
                S&apos;inscrire
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Mot de passe</Label>
                </div>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex-col gap-2'>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <Button variant='outline' className='w-full' type='button'>
              Se connecter avec Google
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
