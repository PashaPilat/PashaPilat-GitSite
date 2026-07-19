import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { t } from "../i18n";
import { getLangFromPath } from "../utils/getLangFromPath";
import "../styles/components/ToggleMode.scss";

function ToggleMode({burgerOpen = "close"}) {
    const location = useLocation();
    const navigate = useNavigate();

    const [isUnity, setIsUnity] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // определяем текущий язык из пути
    const currentLang = getLangFromPath(location.pathname);

    // синхронизируем состояние с URL при загрузке/смене маршрута
    useEffect(() => {
        setIsUnity(location.pathname.includes("unity"));
    }, [location.pathname]);

    const handleToggle = () => {
        setHasInteracted(true); // включаем анимацию после первого клика

        const segments = location.pathname.split("/");
        const langPrefix =
            segments[1] && segments[1].length === 2 ? `/${segments[1]}` : "";

        const nextState = !isUnity;
        setIsUnity(nextState);

        setTimeout(() => {
            if (nextState) {
                navigate(`${langPrefix}/unity`);
            } else {
                navigate(`${langPrefix}/`);
            }
        }, 400); // задержка совпадает с CSS transition
    };

    return (
        <div
            className={`toggle ${isUnity ? "unity" : "web"} ${hasInteracted ? "animate" : ""} ${burgerOpen}`}
            onClick={handleToggle}
        >
            <div className="track">
                <span className="label web">{t(currentLang, "toggle", "web")}</span>
                <span className="slider"></span>
                <span className="label unity">{t(currentLang, "toggle", "unity")}</span>
            </div>
        </div>
    );
}

export default ToggleMode;
