import React from "react";

export default function Corners({ className = "" }) {
    return (
        <span className={`mx-corners ${className}`.trim()} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
        </span>
    );
}
