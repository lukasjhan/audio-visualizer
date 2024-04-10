'use client';

import { useEffect, useRef, useState } from 'react';

function drawAudioWaveform(
  context: CanvasRenderingContext2D,
  audioBuffer: AudioBuffer
) {
  console.log('draw');
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
}

export function HelloWorld() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const fetchAudioData = async () => {
      const response = await fetch('/api/audio');
      const audioBlob = await response.blob();

      // 오디오 데이터 처리 및 시각화 로직 구현
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(
        await audioBlob.arrayBuffer()
      );
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      setAudioContext(audioContext);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Canvas에 오디오 시각화 그리기
      // 예를 들어, 오디오 파형을 그릴 수 있습니다.
      drawAudioWaveform(context, audioBuffer);
    };

    fetchAudioData();
  }, []);

  const handlePlayPause = () => {
    if (audioContext === null) return;
    if (isPlaying) {
      audioContext.suspend();
    } else {
      audioContext.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (audioContext === null) return;
    audioContext.suspend();
    setIsPlaying(false);
  };

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="400" />
      <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}
