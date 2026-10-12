import React, { useEffect, useRef, useState } from "react";
import useReveal from "./useReveal";
import "../../styles/components/SoftWare/HeroStats.scss";

function HeroStats({ stats, className }) {
    const ref = useRef(null);
    useReveal(ref, []);
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
            
                <ul className="software-hero__directions software-reveal" style={{ "--d": "400ms" }}>
                    {stats.map((item, index) => (
                        <li key={item.id}>
                            <span className="software-hero__dnum">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className={`software-hero__dicon ${visible ? "show" : ""}`} aria-hidden="true">
                                {item.icon && <i className={item.icon}></i>} {/* ← иконка */}
                            </span>
                            <span>
                                <strong>{item.value}</strong>
                                <em>{item.label}</em>
                            </span>
                        </li>
                    ))}
                </ul>
             
        </div>
    );
}

export default HeroStats;