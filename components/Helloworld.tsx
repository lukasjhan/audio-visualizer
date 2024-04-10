'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '@/utils/audio';

function drawAudioWaveform(
  context: CanvasRenderingContext2D,
  audioBuffer: AudioBuffer,
  time: number
) {
  const canvas = context.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const channelData = audioBuffer.getChannelData(0); // 첫 번째 채널 데이터 사용
  const step = Math.ceil(channelData.length / width); // 오디오 데이터를 캔버스 너비에 맞게 줄이기 위한 단계

  context.clearRect(0, 0, width, height); // 캔버스 지우기
  context.beginPath();
  context.strokeStyle = 'white';
  context.lineWidth = 1;

  let x = 0;
  for (let i = 0; i < channelData.length; i += step) {
    const y = ((1 + channelData[i]) * height) / 2; // 오디오 데이터를 캔버스 높이에 맞게 조정

    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }

    x += width / (channelData.length / step); // 캔버스 너비에 맞게 x 좌표 증가
  }

  context.stroke();

  const duration = audioBuffer.duration;
  const line = (time / duration) * canvas.width;
  context.strokeStyle = 'red';
  context.beginPath();
  context.moveTo(line, 0);
  context.lineTo(line, canvas.height);
  context.stroke();
}

export function HelloWorld() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioManager = useRef(new AudioManager());
  const [resetCount, updateResetCount] = useState<number>(0);

  useEffect(() => {
    const fetchAudioData = async () => {
      await audioManager.current.load('/api/audio');
      const audioContext = audioManager.current.audioContext;
      const audioBuffer = audioManager.current.buffer;
      if (!audioContext || !audioBuffer) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Canvas에 오디오 시각화 그리기
      // 예를 들어, 오디오 파형을 그릴 수 있습니다.
      drawAudioWaveform(context, audioBuffer, 0);
    };

    fetchAudioData();
  }, []);

  useEffect(() => {
    console.log('change');
    let animationFrameId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      const audioBuffer = audioManager.current.buffer;
      if (canvas && audioBuffer) {
        const context = canvas.getContext('2d');
        if (context) {
          // 기존의 시각화 그리기
          const currentTime = audioManager.current.getCurrentTime();
          drawAudioWaveform(context, audioBuffer, currentTime);
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, resetCount]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioManager.current.pause();
    } else {
      audioManager.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    audioManager.current.pause();
    audioManager.current.reset();
    setIsPlaying(false);
    updateResetCount((prev) => prev + 1);
  };

  return (
    <div>
      <canvas ref={canvasRef} width="1400" height="400" />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button onClick={handlePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}
