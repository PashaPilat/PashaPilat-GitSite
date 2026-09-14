import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { nav } from "../../navigation/navigate";

import LanguageSwitcher from "../../components/LanguageSwitcher";
import ToggleMode from "../../components/ToggleMode";
import "../../styles/components/Home/Navigation.scss";
import logo from "../../assets/images/logo 2.png";

function Navigation() {
    const location = useLocation();
    
    const [menuState, setMenuState] = useState("close");
    const navigationItems = nav("", [], location.pathname);
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
                        {navigationItems.map((item) => (
                            <li key={item.key}>
                                <a
                                    href={item.href}
                                    onClick={handleClose}
                                >
                                    {item.title}
                                </a>
                            </li>
                        ))}
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
