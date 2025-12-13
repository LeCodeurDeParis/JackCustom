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

interface SignUpCardProps {
  onSwitchToSignIn: () => void;
}

export default function SignUpCard({ onSwitchToSignIn }: SignUpCardProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await authClient.signUp.email(
      {
        email,
        password,
        name,
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
    <div className='flex min-h-screen items-center justify-center bg-zinc-50  dark:bg-black'>
      <form onSubmit={handleSignUp} className='w-full max-w-md'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Jack Custom</CardTitle>
            <CardAction>
              <Button variant='link' onClick={onSwitchToSignIn}>
                Se connecter
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
                <Label htmlFor='name'>Pseudo</Label>
                <Input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Button>
            <Button type='submit' variant='outline' className='w-full'>
              S&apos;inscrire avec Google
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
