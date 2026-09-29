import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Aurora — a tiny WebGL fragment shader (no libraries) that paints slow,
 * flowing curtains of light. Reacts softly to the cursor, pauses when the
 * tab is hidden, renders at reduced resolution and falls back to nothing
 * (the CSS backdrop remains) when WebGL or motion is unavailable.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform vec3 uBg; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uGain;

vec3 perm(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = perm(perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p*C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
  vec3 g; g.x = a0.x*x0.x + h.x*x0.y; g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0*dot(m, g);
}
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<3;i++){ s+=a*snoise(p); p*=2.02; a*=0.5; } return s; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.25;

  // domain-warped flow field
  vec2 q = vec2(fbm(p*0.65 + vec2(t, -t*0.7) + m), fbm(p*0.65 + vec2(-t*0.6, t*0.9) + 3.1));
  float n = fbm(p*0.9 + q*1.2 + vec2(t*0.4, 0.0));

  // vertical curtains of light that hang from the top
  float curtain = 0.5 + 0.5*sin(p.x*3.2 + q.x*4.0 + t*2.0);
  curtain = pow(curtain, 3.0);
  float fall = smoothstep(-0.15, 1.05, uv.y);
  float body = fall * (0.45 + 0.55*n) + curtain * fall * fall * 0.55;

  vec3 col = mix(uC1, uC2, smoothstep(-0.4, 0.6, q.x + n*0.5));
  col = mix(col, uC3, smoothstep(0.2, 0.9, q.y + n*0.3) * 0.75);

  // soft light pooled under the cursor
  float md = distance(uv, uMouse);
  float halo = exp(-md*md*9.0) * 0.35;

  vec3 outc = uBg + col * (body * uGain + halo * uGain);
  outc += (hash(gl_FragCoord.xy + uTime) - 0.5) / 180.0; // dither: no banding
  gl_FragColor = vec4(outc, 1.0);
}`;

const PALETTES = {
  dark: { bg: [0.02, 0.024, 0.04], c1: [0.20, 0.58, 0.95], c2: [0.42, 0.36, 0.98], c3: [0.72, 0.45, 0.98], gain: 0.5 },
  light: { bg: [0.965, 0.97, 0.985], c1: [-0.18, -0.02, 0.02], c2: [-0.14, -0.16, 0.0], c3: [0.02, -0.14, 0.0], gain: 0.55 },
} as const;

export default function Aurora() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uBg = u('uBg'), uC1 = u('uC1'), uC2 = u('uC2'), uC3 = u('uC3'), uGain = u('uGain');

    const SCALE = 0.5; // render at half res — it's all soft light anyway
    const resize = () => {
      canvas.width = Math.max(1, Math.floor(window.innerWidth * SCALE));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: 0.5, y: 0.8, tx: 0.5, ty: 0.8 };
    const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / window.innerWidth; mouse.ty = 1 - e.clientY / window.innerHeight; };
    window.addEventListener('pointermove', onMove);

    let raf = 0; let running = true; const start = performance.now();
    const frame = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.035;
      mouse.y += (mouse.ty - mouse.y) * 0.035;
      const pal = PALETTES[themeRef.current];
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 20 : (now - start) / 1000 + 20);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform3fv(uBg, pal.bg); gl.uniform3fv(uC1, pal.c1); gl.uniform3fv(uC2, pal.c2); gl.uniform3fv(uC3, pal.c3);
      gl.uniform1f(uGain, pal.gain);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running && !reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame((n) => { frame(n); setReady(true); });

    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; raf = requestAnimationFrame(frame); }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  return <canvas ref={ref} className={`bg-canvas ${ready ? 'ready' : ''}`} />;
}
