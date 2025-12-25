import Title from "./_components/title";
import JoinRoom from "./_components/join-room";
import CreateRoom from "./_components/create-room";

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center h-screen gap-8'>
      <Title>Jack Custom</Title>
      <div className='flex flex-row items-center justify-center gap-4'>
        <JoinRoom />
        <CreateRoom />
      </div>
    </div>
  );
}
