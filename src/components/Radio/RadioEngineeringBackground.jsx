/* ==========================================================================
   RadioEngineeringBackground (объединяющий компонент)
   --------------------------------------------------------------------------
   Гибридный фон страницы «Разработка радиоустройств»:

     0 — RadioDevelopmentBackground  : 2D canvas (PCB-разводка, техно-сетка,
                                        узлы, импульсы, сигнал и спектр)
     1 — RadioFloating3DObjects      : 3D overlay (левитирующие радиоэлементы,
                                        ghosted CAD / x-ray, cyan glow)

   Оба слоя — background-only: fixed, pointer-events: none, не влияют
   на hero, тексты, кнопки, layout и другие страницы.

   Подключение одной строкой:
     <RadioEngineeringBackground />
   ========================================================================== */

import React from "react";
import RadioDevelopmentBackground from "./RadioDevelopmentBackground.jsx";
import RadioFloating3DObjects from "./RadioFloating3DObjects.jsx";

export default function RadioEngineeringBackground({
  intensity = 1,
  interactive = true,
  depth3d = true,
}) {
  return (
    <>
      <RadioDevelopmentBackground intensity={intensity} interactive={interactive} />
      {depth3d ? <RadioFloating3DObjects /> : null}
    </>
  );
}

export { RadioDevelopmentBackground, RadioFloating3DObjects };
