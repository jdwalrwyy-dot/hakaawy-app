import React, { useEffect, useRef, useState } from 'react';

export interface ChromaKeyCanvasPlayerProps {
  /** URL of the green screen video */
  videoUrl: string;
  /** Whether audio is muted */
  isMuted?: boolean;
  /** Playback speed multiplier (default 0.7 for majestic slow motion) */
  playbackRate?: number;
  /** Key color to remove (RGB array normalized 0..1, default green [0, 1, 0]) */
  keyColor?: [number, number, number];
  /** Similarity threshold for chroma key (default 0.38) */
  similarity?: number;
  /** Smoothness of edge transition (default 0.12) */
  smoothness?: number;
  /** Spill suppression amount for green reflections (default 0.35) */
  spill?: number;
  /** Callback when video ends */
  onEnded?: () => void;
  /** CSS Class name */
  className?: string;
}

/**
 * 🟢 WebGL / HTML5 Canvas Chroma Key Video Player
 * Programmatically removes green screen backgrounds in real-time
 * with GPU hardware acceleration, edge smoothing, and spill suppression.
 */
export const ChromaKeyCanvasPlayer: React.FC<ChromaKeyCanvasPlayerProps> = ({
  videoUrl,
  isMuted = false,
  playbackRate = 0.7,
  keyColor = [0.05, 0.85, 0.15],
  similarity = 0.38,
  smoothness = 0.12,
  spill = 0.35,
  onEnded,
  className = 'w-full h-full object-contain'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = isMuted;
    video.autoplay = true;
    video.playbackRate = playbackRate;
    video.loop = false;
    videoRef.current = video;

    let isMounted = true;

    // WebGL Vertex Shader
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;

    // WebGL Fragment Shader with Chroma Key & Green Spill Removal
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec3 u_keyColor;
      uniform float u_similarity;
      uniform float u_smoothness;
      uniform float u_spill;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // Distance in RGB
        float diff = distance(color.rgb, u_keyColor);
        
        // Smooth alpha mask
        float alpha = smoothstep(u_similarity, u_similarity + u_smoothness, diff);
        
        // Despill green reflections
        float greenVal = color.g - max(color.r, color.b);
        if (greenVal > 0.0) {
          color.g -= greenVal * u_spill;
        }

        gl_FragColor = vec4(color.rgb * alpha, alpha * color.a);
      }
    `;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    glRef.current = gl;

    if (gl) {
      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
      const fragShader = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vertShader && fragShader) {
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vertShader);
          gl.attachShader(program, fragShader);
          gl.linkProgram(program);
          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            programRef.current = program;

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                -1.0, -1.0,  0.0, 0.0,
                 1.0, -1.0,  1.0, 0.0,
                -1.0,  1.0,  0.0, 1.0,
                -1.0,  1.0,  0.0, 1.0,
                 1.0, -1.0,  1.0, 0.0,
                 1.0,  1.0,  1.0, 1.0,
              ]),
              gl.STATIC_DRAW
            );

            const aPosition = gl.getAttribLocation(program, 'a_position');
            const aTexCoord = gl.getAttribLocation(program, 'a_texCoord');

            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);

            gl.enableVertexAttribArray(aTexCoord);
            gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            textureRef.current = texture;

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          }
        }
      }
    }

    const handleCanPlay = () => {
      if (!isMounted) return;
      video.playbackRate = playbackRate;
      video.play().catch((err) => {
        console.warn('ChromaKey Video Autoplay Error:', err);
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    if (onEnded) {
      video.addEventListener('ended', onEnded);
    }
    video.addEventListener('error', () => {
      setHasError(true);
    });

    // Fallback autoplay attempt
    video.play().catch(() => {});

    const render = () => {
      if (!isMounted) return;

      if (video && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
        }

        if (gl && programRef.current && textureRef.current) {
          gl.useProgram(programRef.current);

          const uKeyColor = gl.getUniformLocation(programRef.current, 'u_keyColor');
          const uSimilarity = gl.getUniformLocation(programRef.current, 'u_similarity');
          const uSmoothness = gl.getUniformLocation(programRef.current, 'u_smoothness');
          const uSpill = gl.getUniformLocation(programRef.current, 'u_spill');

          gl.uniform3fv(uKeyColor, new Float32Array(keyColor));
          gl.uniform1f(uSimilarity, similarity);
          gl.uniform1f(uSmoothness, smoothness);
          gl.uniform1f(uSpill, spill);

          gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          } catch (e) {
            // CORS fallback if webgl texImage2D fails
          }

          gl.clearColor(0.0, 0.0, 0.0, 0.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        } else {
          // 2D Canvas Fallback
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              const frame = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
              const data = frame.data;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Remove green screen pixels
                if (g > 90 && g > r * 1.35 && g > b * 1.35) {
                  data[i + 3] = 0;
                }
              }
              ctx2d.putImageData(frame, 0, 0);
            } catch (e) {
              // Ignore image data security error if CORS blocked
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, [videoUrl, keyColor, similarity, smoothness, spill, playbackRate, onEnded]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  if (hasError) {
    return (
      <div className="text-amber-400 text-xs font-bold p-4 bg-black/60 rounded-xl text-center">
        جاري تفرغ فيديو الخلفية الخضراء...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          background: 'transparent',
          maxHeight: '100vh',
          maxWidth: '100vw'
        }}
      />
    </div>
  );
};
