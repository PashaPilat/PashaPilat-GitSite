import React from "react";
import SoftwareMatrixBackground from "../../components/SoftWare/SoftwareMatrixBackground";
import Navigation from "../../components/Home/Navigation";
import ProjectPage from "../../components/SoftWare/ProjectPage";
import CursorFollower from "../../components/CursorFollower";
import "../../styles/pages/software.scss";

export default function Project() {
    return (
        <div className="hero-wrapper software-page" id="top">
            <SoftwareMatrixBackground />
            <Navigation />
            <ProjectPage />
            <CursorFollower />
        </div>
    );
}
