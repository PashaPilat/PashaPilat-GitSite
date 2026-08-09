import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { t } from "../../i18n";
import Lenis from "lenis";

import { getLangFromPath } from "../../utils/getLangFromPath";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ToggleMode from "../../components/ToggleMode";
import "../../styles/components/Home/Navigation.scss";
import logo from "../../assets/images/logo 2.png";

function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentLang = getLangFromPath(location.pathname);

    const [menuState, setMenuState] = useState("close");
    // варианты: 
    // "close", nav-controls закрыт и не виден,logo виден, logo-burger не виден
    // "opening", имеет несколько статусов shows и open, nav-controls в этот момент начало анимаций открытия, тоесть  nav-controls уже дисплей блок, logo исчезает за 1с,logo-burger не виден
    // "shows", nav-controls открылся на уровень контента, началась анимация появления списка меню(позиция с левой стороны, не по центру), лого закрыт, logo-burger анимация появления, ToggleMode (сверху с права, в открывшемся меню левее кнопки закрытия), LanguageSwitcher (сверху с права, в открывшемся меню левее кнопки закрытия)
    // "open", статус все открыто и видно на своих местах 
    // "hiden", имеет несколько статусов closing и close, nav-controls в этот момент начало анимаций закрытия, тоесть  nav-controls еще дисплей блок, logo еще не виден, logo-burger, ToggleMode, LanguageSwitcher, списка меню исчезает за 1с в бургер меню
    // "closing" nav-controls закрыт и не виден дисплей none, logo начал появлятся, logo-burger дисплей ноне
    const handleOpen = () => {
        setMenuState("opening");
        setTimeout(() => setMenuState("shows"), 1500); // после 1.5с
        setTimeout(() => setMenuState("open"), 1500 + 1300); // ещё через 1.3с
    };

    const handleClose = () => {
        setMenuState("hiden");
        setTimeout(() => setMenuState("closing"), 1300); // исчезают элементы
        setTimeout(() => setMenuState("close"), 1300 + 1500); // меню уезжает вверх
    };
    const handleScroll = (e, id) => {
        e.preventDefault(); // отменяем стандартный переход
        const el = document.querySelector(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
        handleClose(); // закрываем меню после клика
    };

    function smoothScrollTo(targetId, duration = 1500, offset = 0) {
        const target = document.querySelector(targetId);
        if (!target) return;

        const start = window.scrollY;
        const end = target.getBoundingClientRect().top + window.scrollY + offset;
        const distance = end - start;
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, start + distance * ease);
            if (elapsed < duration) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }



useEffect(() => {
  window.setMenuState = setMenuState;
}, []);


    return (
        <header className="home">
            <nav className="navbar">
                <div className={`logo ${menuState}`}>
                    <img src={logo} alt="Logo" className="logo-img" />
                    PashaPilat
                </div>
                <div className={`nav-controls ${menuState}`}>
                    <div className={`logo-burger ${menuState}`}>
                        <img src={logo} alt="Logo" className="logo-img" />
                        PashaPilat
                    </div>
                    <ul className={`nav-links ${menuState}`}>
                        <li>
                            <a href="#projects" onClick={(e) => {
                            e.preventDefault();
                            window.lenis.scrollTo("#projects", 
                                { duration: 3.0, easing: (t) => t,offset: -1415  }
                            );
                            handleClose();
                            }}>
                            {t(currentLang, "nav", "projects")}
                            </a>
                        </li>
                        <li>
                            <a href="#services" onClick={(e) => {
                            e.preventDefault();
                            window.lenis.scrollTo("#services", 
                                { duration: 4.5, easing: (t) => t,offset: -1515  }
                            );
                            handleClose();
                            }}>
                            {t(currentLang, "nav", "services")}
                            </a>
                        </li>
                        <li>
                            <a href="#about" onClick={(e) => {
                            e.preventDefault();
                            window.lenis.scrollTo("#about", { duration: 2.5 });
                            handleClose();
                            }}>
                            {t(currentLang, "nav", "about")}
                            </a>
                        </li>
                        <li>
                            <a href="#contact" onClick={(e) => {
                            e.preventDefault();
                            window.lenis.scrollTo("#contact", { duration: 3.0 });
                            handleClose();
                            }}>
                            {t(currentLang, "nav", "contact")}
                            </a>
                        </li>
                    </ul>



                    <ToggleMode burgerOpen={menuState} />
                    <LanguageSwitcher burgerOpen={menuState} />
                    <div className={`burger burger-btn-close ${menuState}`} onClick={handleClose}><i className="fas fa-times"></i></div>
                </div>
                <div className={`burger burger-btn-open  ${menuState}`} onClick={handleOpen}>
                    <i className="fas fa-bars"></i>
                </div>
            </nav>
        </header>
    );
}

export default Navigation;
