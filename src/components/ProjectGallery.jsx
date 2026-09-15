import React, { useState } from "react";

export default function ProjectGallery({ project, copy, detail = false }) {
    const [index, setIndex] = useState(0);
    const images = project.images;
    const current = images[index % Math.max(images.length, 1)];
    return (
        <div className={`project-gallery ${detail ? "project-gallery--detail" : ""}`} aria-label={`${copy.photos}: ${project.title}`}>
            {current ? <img src={current} alt={`${project.title} — ${index + 1}`} loading={detail ? "eager" : "lazy"} /> :
                <div className="project-gallery__placeholder" aria-hidden="true"><span>{project.title.slice(0, 2).toUpperCase()}</span><small>{project.title}</small></div>}
            {images.length > 1 && <div className="project-gallery__controls">
                <button type="button" onClick={() => setIndex(value => (value - 1 + images.length) % images.length)} aria-label={copy.prevPhoto}>←</button>
                <span aria-live="polite">{index + 1} / {images.length}</span>
                <button type="button" onClick={() => setIndex(value => (value + 1) % images.length)} aria-label={copy.nextPhoto}>→</button>
            </div>}
            {detail && images.length > 1 && <div className="project-gallery__thumbs">
                {images.map((src, i) => <button key={src} type="button" aria-label={`${copy.photos}: ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)}><img src={src} alt="" loading="lazy" /></button>)}
            </div>}
        </div>
    );
}
