"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function JoinRoom() {
  return (
    <div>
      <Card className='py-8'>
        <CardHeader>
          <CardTitle className='flex items-center justify-center'>
            Join Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input type='text' placeholder='Room ID' />
        </CardContent>
        <CardFooter>
          <Button type='submit' className='w-full'>
            Join
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
