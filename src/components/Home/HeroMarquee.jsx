import React from "react";
import "../../styles/components/Home/HeroMarquee.scss";

const MARQUEE = [
    "HTML5", "CSS3", "SCSS", "Tailwind CSS", "Twig", "Bootstrap",
    "JavaScript", "TypeScript", "jQuery",
    "React", "Next.js", "Node.js",
    "PHP", "Laravel", "Livewire",
    "REST API", "Microservices", "CI/CD", "WebSocket",
    "MySQL", "PostgreSQL", "Redis", "RabbitMQ", "ElasticSearch",
    "Docker", "Docker Compose", "Git", "Laradock", "Nginx","Apache", "MinIO",
    "Webpack", "Vite", "NPM", "Composer",
    "Performance","Responsive Design","UI/UX", "Architecture",
    "Messaging Systems","Authentication & Authorization", "Matrix Synapse",
    "OpenCart","ShopScript","ModX", "WordPress", "CustomCMS"
];

export default function HeroMarquee (){

    return (
        <div className="hero__marquee" aria-hidden>
        <div className="hero__marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="hero__marquee-row">
              {MARQUEE.map((tech) => (
                <span key={`${copy}-${tech}`} className="hero__marquee-item">
                  {tech}
                  <i>✳</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    );
}