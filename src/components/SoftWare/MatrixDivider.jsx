import React, { useMemo } from "react";

const GLYPHS = "01<>/\\[]{}=+*ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾂﾃﾄﾅﾆﾇﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

function steppedFrame(steps = 22, depth = 12) {
    const top = [];
    const bottom = [];
    for (let i = 0; i <= steps; i++) {
        const x = +((i / steps) * 100).toFixed(3);
        top.push(`${x}% ${i % 2 ? depth : 0}px`);
        bottom.push(`${x}% ${i % 2 ? "100%" : `calc(100% - ${depth}px)`}`);
    }
    return `polygon(${[...top, ...bottom.reverse()].join(",")})`;
}

const randStr = (n) => Array.from({ length: n }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");

export default function MatrixDivider({ index = "01", label = "", note = "", variant = "default", className = "" }) {
    const clip = useMemo(() => steppedFrame(), []);
    const cols = useMemo(() => {
        const n = variant === "heavy" ? 26 : 16;
        return Array.from({ length: n }, (_, i) => ({
            left: ((i + Math.random() * 0.6) / n) * 100,
            dur: 4.5 + Math.random() * 5,
            delay: -(Math.random() * 10),
            op: 0.16 + Math.random() * 0.4,
            text: randStr(26),
        }));
    }, [variant]);

    const cls = [
        "software-divider",
        variant === "heavy" ? "software-divider--heavy" : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <div className={cls} role="presentation" aria-hidden="true">
            <div className="software-divider__band" style={{ clipPath: clip }}>
                <span className="software-divider__rain">
                    {cols.map((c, i) => (
                        <span
                            key={i}
                            className="software-divider__col"
                            style={{ left: `${c.left}%`, "--t": `${c.dur}s`, "--dl": `${c.delay}s`, "--o": c.op }}
                        >
                            {c.text}
                        </span>
                    ))}
                </span>
                <span className="software-divider__mid">
                    <i className="software-divider__line software-divider__line--l" />
                    <span className="software-divider__tag">
                        [ {index} · {label} ]
                        {note && <em className="software-divider__note">{note}</em>}
                    </span>
                    <i className="software-divider__line software-divider__line--r" />
                </span>
                <span className="software-divider__seam software-divider__seam--top" />
                <span className="software-divider__seam software-divider__seam--bottom" />
            </div>
        </div>
    );
}
