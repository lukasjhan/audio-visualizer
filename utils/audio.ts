'use client';

export class AudioManager {
  public audioContext: AudioContext;
  public source: AudioBufferSourceNode | null;
  public buffer: AudioBuffer | null;
  public isPlaying: boolean;
  public analyser: AnalyserNode | null;
  public dataArray: Uint8Array | null;

  constructor() {
    this.audioContext = new AudioContext();
    this.source = null;
    this.buffer = null;
    this.analyser = null;
    this.dataArray = null;
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
    this.audioContext = new AudioContext();
    if (this.source) {
      this.source.disconnect();
    }
    this.source = this.audioContext.createBufferSource();
    if (this.buffer) {
      this.source.buffer = this.buffer;
    }
    this.source.connect(this.audioContext.destination);
    this.source.start(0, 0);
    this.audioContext.suspend();

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
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
      this.setupSource(); // 초기 상태로 source 노드 재설정
    }
  }

  getCurrentTime(): number {
    return this.audioContext.currentTime;
  }
}
