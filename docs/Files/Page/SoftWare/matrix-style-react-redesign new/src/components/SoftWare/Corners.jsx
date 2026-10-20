import React from "react";

// HUD-уголки: рамка из четырёх скобок по углам контейнера.
// Располагать внутри relative-родителя. Чисто декоративный.
export default function Corners({ className = "" }) {
    return (
        <span className={`mx-corners ${className}`.trim()} aria-hidden="true">
            <i /><i /><i /><i />
        </span>
    );
}
