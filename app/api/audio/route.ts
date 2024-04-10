import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export function GET(request: NextRequest) {
  const audioPath = path.join(process.cwd(), 'public', 'audio.mp3');
  const audioBuffer = fs.readFileSync(audioPath);

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg3',
    },
  });
}
