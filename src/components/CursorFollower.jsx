import React, { useEffect, useRef } from "react";
import "../styles/components/CursorFollower.scss";

function CursorFollower() {
    const circleRef = useRef(null);
    const targetPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const fadeTimeout = useRef(null);
    const animationFrameId = useRef(null);

    useEffect(() => {
        const move = e => {
            targetPos.current = { x: e.clientX, y: e.clientY };

            // сбрасываем таймер растворения
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);

            // плавное появление
            if (circleRef.current) {
                circleRef.current.style.transition = "opacity 1s ease";
                circleRef.current.style.opacity = 1;
            }

            // через 1.5с без движения запускаем растворение
            fadeTimeout.current = setTimeout(() => {
                if (circleRef.current) {
                    circleRef.current.style.transition = "opacity 1s ease";
                    circleRef.current.style.opacity = 0;
                }
            }, 1500);
        };

        const leave = () => {
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
            if (circleRef.current) {
                circleRef.current.style.transition = "opacity 1s ease";
                circleRef.current.style.opacity = 0;
            }
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseleave", leave);

        let lastTime = performance.now();

        const animate = time => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            const maxSpeed = 300; // px/сек
            const dx = targetPos.current.x - currentPos.current.x;
            const dy = targetPos.current.y - currentPos.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0.5) {
                const maxStep = maxSpeed * dt;
                const step = Math.min(maxStep, dist);

                currentPos.current.x += (dx / dist) * step;
                currentPos.current.y += (dy / dist) * step;

                if (circleRef.current) {
                    circleRef.current.style.left = currentPos.current.x + "px";
                    circleRef.current.style.top = currentPos.current.y + "px";
                }
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseleave", leave);
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return <div ref={circleRef} className="cursor-circle" />;
}

export default CursorFollower;
