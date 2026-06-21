'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export function usePoseDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const initializePose = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { Pose } = await import('@mediapipe/pose');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
      const { POSE_CONNECTIONS } = await import('@mediapipe/pose');

      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#3B82F6',
            lineWidth: 3,
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: '#10B981',
            lineWidth: 2,
            radius: 5,
          });
        }
        ctx.restore();
      });

      poseRef.current = pose;
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize pose detection');
      setIsLoading(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !poseRef.current) return;
    try {
      const { Camera } = await import('@mediapipe/camera_utils');
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await poseRef.current.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
      setIsRunning(true);
    } catch (err) {
      setError('Failed to access webcam');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    initializePose();
    return () => {
      stopCamera();
    };
  }, [initializePose, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isRunning,
    error,
    startCamera,
    stopCamera,
  };
}
