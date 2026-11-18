
import { useEffect, useRef } from "react";

const characters =
  "01アイウエオカキクケコサシスセソABCDEF#$%&<>/{}[]";

export default function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let columns = 0;

    const fontSize = 14;
    let drops: number[] = [];

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      columns = Math.ceil(width / fontSize);

      drops = Array.from(
        { length: columns },
        () => Math.random() * -100
      );
    };

    resize();
    window.addEventListener("resize", resize);

    let lastFrame = 0;

    const draw = (time: number) => {
      animationFrame = requestAnimationFrame(draw);

      if (time - lastFrame < 45) return;
      lastFrame = time;

      context.fillStyle = "rgba(8, 14, 28, 0.12)";
      context.fillRect(0, 0, width, height);

      context.font = `${fontSize}px monospace`;

      drops.forEach((drop, index) => {
        const character =
          characters[Math.floor(Math.random() * characters.length)];

        const x = index * fontSize;
        const y = drop * fontSize;

        const highlight = Math.random() > 0.985;

        context.fillStyle = highlight
          ? "rgba(103, 232, 249, 0.9)"
          : "rgba(34, 211, 238, 0.32)";

        if (highlight) {
          context.shadowBlur = 12;
          context.shadowColor = "#22D3EE";
        } else {
          context.shadowBlur = 0;
        }

        context.fillText(character, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[index] = 0;
        } else {
          drops[index] += Math.random() * 0.55 + 0.25;
        }
      });

      context.shadowBlur = 0;
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="code-rain"
      aria-hidden="true"
    />
  );
}
