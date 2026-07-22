import React, { useEffect, useRef, useState } from "react";
import "../styles/components/HeroStats.scss";

function HeroStats({ stats, className }) {
    const ref = useRef(null);

    const [visible, setVisible] = useState(false);
    const [numbersDone, setNumbersDone] = useState(false);
    const [labelsDone, setLabelsDone] = useState(false);
    const [values, setValues] = useState({});

    useEffect(() => {
        const observer = new IntersectionObserver( 
            ([entry]) => {
             if (entry.isIntersecting) { setVisible(true);  observer.disconnect(); }
            }, { threshold: 0.35,}
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;

        const duration = 2500;
        const start = performance.now();

        function animate(time) {
            const progress = Math.min((time - start) / duration, 1);
            const next = {};
            stats.forEach((item) => {
                if (item.type === "number") { next[item.id] = Math.floor(item.value * progress); }
            });
            setValues(next);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setNumbersDone(true);
                setTimeout(() => { setLabelsDone(true); }, 1000);
            }
        }
        requestAnimationFrame(animate);
    }, [visible, stats]);

    return (
        <div ref={ref} className={`hero-stats ${visible ? "visible" : ""} ${className || ""}`} >
            <div className="hero-stats-grid">
                {stats.map((item) => (
                    <div className="hero-stats-item" key={item.id}>
                        <div className="hero-stats-item-iner" >
                            {item.type === "number" ? (
                                <>
                                    <div className={`hero-stat-value ${numbersDone ? "done" : ""}`}>
                                        {values[item.id] ?? 0}
                                        {numbersDone && "+"}
                                    </div>
                                    <div className={`hero-stat-label ${labelsDone ? "show" : ""}`}>
                                        {item.label}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`hero-stat-tech ${visible ? "show" : ""}`}>
                                        {item.icon && <i className={item.icon}></i>} {/* ← иконка */}
                                        {item.value}
                                    </div>
                                    <div className={`hero-stat-label ${labelsDone ? "show" : ""}`}>
                                        {item.label}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>  
        </div>
    );
}

export default HeroStats;