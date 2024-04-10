import { HelloWorld } from '@/components/Helloworld';

export default function Home() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '2rem',
      }}
    >
      <h1>Audio Player</h1>
      <HelloWorld></HelloWorld>
    </div>
  );
}
