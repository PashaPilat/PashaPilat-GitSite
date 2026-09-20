import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getLangFromPath } from "../utils/getLangFromPath";
import { modes, modeIndexFromPath, modePath } from "../navigation/modes.mjs";
import "../styles/components/ToggleMode.scss";

function ToggleMode({ burgerOpen = "close" }) {
    const location = useLocation();
    const navigate = useNavigate();
    const current = modeIndexFromPath(location.pathname);
    const [preview, setPreview] = useState(null);
    const gesture = useRef(null);
    const selected = preview ?? current;
    const select = index => navigate(modePath(index, getLangFromPath(location.pathname)));
    const position = event => {
        const ticks = event.currentTarget.querySelector('.mode-ticks');
        const first = ticks.firstElementChild.getBoundingClientRect();
        const last = ticks.lastElementChild.getBoundingClientRect();
        const start = first.left + first.width / 2;
        const end = last.left + last.width / 2;
        return Math.max(0, Math.min(4, Math.round((event.clientX - start) / (end - start) * 4)));
    };
    const keyDown = event => {
        let next;
        if (["ArrowRight", "ArrowUp"].includes(event.key)) next = Math.min(4, current + 1);
        if (["ArrowLeft", "ArrowDown"].includes(event.key)) next = Math.max(0, current - 1);
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = 4;
        if (["Enter", " "].includes(event.key)) next = (current + 1) % 5;
        if (next !== undefined) { event.preventDefault(); select(next); }
    };
    return (
        <div className={`toggle ${burgerOpen}`} style={{ "--mode-position": selected }}>
            <div className="mode-track" role="slider" tabIndex={0}
                aria-label={modes.map(mode => mode.label).join(' / ')}
                aria-valuemin={1} aria-valuemax={5} aria-valuenow={selected + 1}
                aria-valuetext={modes[selected].label} onKeyDown={keyDown}
                onPointerDown={event => {
                    if (event.button !== 0) return;
                    event.currentTarget.focus();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    gesture.current = { x: event.clientX, moved: false };
                }}
                onPointerMove={event => {
                    if (!gesture.current) return;
                    if (Math.abs(event.clientX - gesture.current.x) > 4) gesture.current.moved = true;
                    if (gesture.current.moved) setPreview(position(event));
                }}
                onPointerUp={event => {
                    if (!gesture.current) return;
                    const next = gesture.current.moved ? position(event) : (current + 1) % 5;
                    gesture.current = null;
                    setPreview(null);
                    select(next);
                }}
                onPointerCancel={() => { gesture.current = null; setPreview(null); }}
                onLostPointerCapture={() => { gesture.current = null; setPreview(null); }}>
                <span className="mode-ticks" aria-hidden="true">
                    {modes.map((mode, index) => <span key={mode.id} className={index === selected ? "active" : ""} />)}
                </span>
                <span className="mode-well" aria-hidden="true">
                    <span className="mode-thumb"><i /><i /><i /></span>
                </span>
            </div>
            <span className="mode-display" aria-hidden="true">{modes[selected].label}</span>
        </div>
    );
}
export default ToggleMode;
