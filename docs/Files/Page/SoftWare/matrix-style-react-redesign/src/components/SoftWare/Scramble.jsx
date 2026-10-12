import React, { useEffect, useRef, useState } from "react";

const GLYPHS = "01<>/\\[]{}=+*#%@$&ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾂﾃﾄﾅﾆﾇﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

const scrambleOnce = (text) =>
    text.split("").map((ch) => (ch === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");

// «Декодирование» текста: при появлении во вьюпорте символы
// перебираются и собираются в настоящую строку.
export default function Scramble({ text, as: Tag = "span", className = "", duration = 950 }) {
    const ref = useRef(null);
    const [out, setOut] = useState(() => scrambleOnce(text));

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        setOut(scrambleOnce(text));

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
            setOut(text);
            return undefined;
        }

        let raf = 0;
        let t0 = 0;
        const run = (ts) => {
            if (!t0) t0 = ts;
            const p = Math.min(1, (ts - t0) / duration);
            const reveal = Math.floor(p * text.length);
            let s = "";
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                s += i < reveal || ch === " " || ch === "\n" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            setOut(s);
            if (p < 1) raf = requestAnimationFrame(run);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    raf = requestAnimationFrame(run);
                    io.disconnect();
                }
            });
        }, { threshold: 0.35 });
        io.observe(el);
        return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }, [text, duration]);

    return <Tag ref={ref} className={className} style={{ whiteSpace: "pre-wrap" }}>{out}</Tag>;
}
