import React from "react";
import "../styles/components/GlowButton.scss";

const GlowButton = ({
    children,
    href,
    target,
    rel,
    onClick,
    type = "button",
    size = "md",
    variant = "primary",
    disabled = false,
    className = "",
    width,
    height,
    background = "#000000",
    frameColor = "#3b3b3b",
    textColor = "#ffffff",
    glowColor = "#ffffff",
    style = {},
}) => {
    const Component = href ? "a" : "button";
    const buttonStyle = {
        "--btn-bg": background,
        "--btn-frame": frameColor,
        "--btn-text": textColor,
        "--btn-glow": glowColor,
        width,
        height,
        ...style,
    };

    return (
        <Component
            className={`
        glow-button
        glow-button--${size}
        glow-button--${variant}
        ${disabled ? "is-disabled" : ""}
        ${className}
      `}
            href={href}
            target={target}
            rel={rel}
            type={href ? undefined : type}
            onClick={disabled ? undefined : onClick}
            style={buttonStyle}
        >
            {/* Frame */}
            <div className="glow-button__frame">
                {/* Inner */}
                <div className="glow-button__inner">
                    {/* Internal White Glows */}
                    <div className="glow-button__glow glow-button__glow--1" />
                    <div className="glow-button__glow glow-button__glow--2" />

                    {/* Text */}
                    <div className="glow-button__text-container">
                        <div className="glow-button__richtext">
                            <p className="glow-button__text">{children}</p>
                        </div>
                    </div>
                </div>

                {/* White highlights */}
                <div className="glow-button__white-top" />
                <div className="glow-button__white-blur glow-button__white-blur--1" />
                <div className="glow-button__white-blur glow-button__white-blur--2" />
            </div>

            {/* Outer White Glows */}
            <div className="glow-button__outer-glow glow-button__outer-glow--1" />
            <div className="glow-button__outer-glow glow-button__outer-glow--2" />
        </Component>
    );
};

export default GlowButton;