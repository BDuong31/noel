'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { desc } from "framer-motion/client";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const CONFIG = {
      colors: {
        bg: 0x050d1a, 
        fog: 0x050d1a,
      },
      snowCount: 5000,
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.bg);
    scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.01); 

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 40);

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const spotBlue = new THREE.SpotLight(0x6688ff, 800);
    spotBlue.position.set(-30, 20, -30);
    scene.add(spotBlue);

    const createSnow = () => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const velocities = [];

      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      const snowTexture = new THREE.CanvasTexture(canvas);

      for (let i = 0; i < CONFIG.snowCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(150);
        const y = THREE.MathUtils.randFloatSpread(100);
        const z = THREE.MathUtils.randFloatSpread(100);
        vertices.push(x, y, z);

        velocities.push(Math.random() * 0.1 + 0.05);
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setAttribute(
        "userData",
        new THREE.Float32BufferAttribute(velocities, 1)
      );

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        map: snowTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const snowSystem = new THREE.Points(geometry, material);
      scene.add(snowSystem);
      return snowSystem;
    };

    const snowSystem = createSnow();

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.8; 
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const positions = snowSystem.geometry.attributes.position.array as Float32Array;
      const velocities = snowSystem.geometry.attributes.userData.array as Float32Array;

      for (let i = 0; i < CONFIG.snowCount; i++) {
        positions[i * 3 + 1] -= velocities[i];

        positions[i * 3] += Math.sin(clock.getElapsedTime() + i) * 0.02;

        if (positions[i * 3 + 1] < -50) {
          positions[i * 3 + 1] = 50; 
          positions[i * 3] = THREE.MathUtils.randFloatSpread(150);
          positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(100);
        }
      }
      snowSystem.geometry.attributes.position.needsUpdate = true;

      scene.rotation.y += 0.0005;

      composer.render();
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      snowSystem.geometry.dispose();
      (snowSystem.material as THREE.Material).dispose();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      router.push(`/tree?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center bg-[#050d1a]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block z-0 outline-none"
      />

      <div className="z-10 p-10 text-center border border-[#d4af37]/30 rounded-xl bg-[#050d1a]/40 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.5)] max-w-2xl w-full mx-4 relative">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60"></div>

        <h1
          className="text-4xl md:text-5xl font-bold mb-2 tracking-widest uppercase text-[#fceea7] drop-shadow-[0_0_15px_rgba(252,238,167,0.4)]"
          style={{ fontFamily: '"Cinzel", serif' }}
        >
          Merry Christmas
        </h1>

        <p
          className="text-[#d4af37] text-xs md:text-sm tracking-[4px] opacity-80 mb-10 uppercase mt-3"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          Magic Tree Experience
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
          <div className="relative group w-full px-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-transparent border-b border-[#d4af37]/40 py-2 text-center text-2xl text-[#fceea7] outline-none placeholder:text-[#d4af37]/30 focus:border-[#d4af37] transition-all"
              style={{ fontFamily: "'Times New Roman', serif" }}
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-12 py-3 border border-[#d4af37]/60 text-[#d4af37] uppercase tracking-[3px] text-xs font-bold hover:bg-[#d4af37] hover:text-[#050d1a] transition-all duration-500 shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_0_40px_rgba(212,175,55,0.8)]"
              style={{ fontFamily: "'Times New Roman', serif" }}
            >
              Create My Tree
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}