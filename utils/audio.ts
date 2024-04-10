'use client';

export class AudioManager {
  public audioContext: AudioContext;
  public source: AudioBufferSourceNode | null;
  public buffer: AudioBuffer | null;
  public isPlaying: boolean;

  constructor() {
    this.audioContext = new AudioContext();
    this.source = null;
    this.buffer = null;
    this.isPlaying = false;
  }

  async load(url: string): Promise<void> {
    const response = await fetch(url);
    const audioBlob = await response.blob();
    this.buffer = await this.audioContext.decodeAudioData(
      await audioBlob.arrayBuffer()
    );
    this.setupSource();
  }

  private setupSource(): void {
    if (this.source) {
      this.source.disconnect();
    }
    this.source = this.audioContext.createBufferSource();
    if (this.buffer) {
      this.source.buffer = this.buffer;
    }
    this.source.connect(this.audioContext.destination);
    this.source.start();
  }

  play(): void {
    if (!this.isPlaying && this.buffer) {
      this.setupSource(); // 항상 새 source 노드를 생성해야 합니다.
      this.source!.start(0);
      this.isPlaying = true;
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.audioContext.suspend().then(() => {
        this.isPlaying = false;
      });
    }
  }

  resume(): void {
    if (!this.isPlaying) {
      this.audioContext.resume().then(() => {
        this.isPlaying = true;
      });
    }
  }

  reset(): void {
    if (this.isPlaying || this.audioContext.state === 'suspended') {
      this.source!.stop();
      this.setupSource(); // 초기 상태로 source 노드 재설정
      this.isPlaying = false;
    }
  }
}
