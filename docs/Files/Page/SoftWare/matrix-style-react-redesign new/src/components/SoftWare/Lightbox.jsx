import React, { useEffect } from "react";

export default function Lightbox({ items, index, onClose, onIndex }) {
    useEffect(() => {
        if (index < 0) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
            if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [index, items.length, onClose, onIndex]);

    if (index < 0) return null;
    const item = items[index];
    return (
        <div className="mx-lightbox" role="dialog" aria-modal="true" aria-label={item.caption} onClick={onClose}>
            <div className="mx-lightbox__inner" onClick={(e) => e.stopPropagation()}>
                <div className="mx-lightbox__bar">
                    <span>[{String(index + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}] {item.caption}</span>
                    <button type="button" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>
                <img src={item.src} alt={item.caption} />
                {items.length > 1 && <>
                    <button type="button" className="mx-lightbox__nav mx-lightbox__nav--prev" aria-label="Предыдущее" onClick={() => onIndex((index - 1 + items.length) % items.length)}>‹</button>
                    <button type="button" className="mx-lightbox__nav mx-lightbox__nav--next" aria-label="Следующее" onClick={() => onIndex((index + 1) % items.length)}>›</button>
                </>}
            </div>
        </div>
    );
}
