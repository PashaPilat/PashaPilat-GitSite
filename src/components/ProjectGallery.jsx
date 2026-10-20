import React, { useState } from "react";
import Lightbox from "./SoftWare/Lightbox";

const HighlightText = ({ text, query, className }) => {
    if (!query || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return <>{parts.map((part, i) => part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className={className || "project-highlight"}>{part}</mark>
        : <span key={i}>{part}</span>)}</>;
};

export default function ProjectGallery({ project, copy, detail = false, query, lightbox = false }) {
    const [index, setIndex] = useState(0);
    const [lbOpen, setLbOpen] = useState(-1);
    const images = project.images || [];
    const current = images[index % Math.max(images.length, 1)];
    const items = images.map((src, i) => ({ src, caption: `${project.title} — ${i + 1}` }));

    return (
        <div className={`project-gallery ${detail ? "project-gallery--detail" : ""}`} aria-label={`${copy.photos}: ${project.title}`}>
            {current ? <img src={current} alt={`${project.title} — ${index + 1}`} loading={detail ? "eager" : "lazy"} onClick={lightbox && images.length > 0 ? () => setLbOpen(index) : undefined} style={lightbox ? { cursor: "pointer" } : undefined} /> :
                <div className="project-gallery__placeholder" aria-hidden="true"><span>{project.title.slice(0, 2).toUpperCase()}</span><small><HighlightText text={project.title} query={query} /></small></div>}
            {images.length > 1 && <div className="project-gallery__controls">
                <button type="button" onClick={() => setIndex(value => (value - 1 + images.length) % images.length)} aria-label={copy.prevPhoto}>←</button>
                <span aria-live="polite">{index + 1} / {images.length}</span>
                <button type="button" onClick={() => setIndex(value => (value + 1) % images.length)} aria-label={copy.nextPhoto}>→</button>
            </div>}
            {lightbox && <Lightbox items={items} index={lbOpen} onClose={() => setLbOpen(-1)} onIndex={setLbOpen} className="mx-lightbox--web" />}
        </div>
    );
}
