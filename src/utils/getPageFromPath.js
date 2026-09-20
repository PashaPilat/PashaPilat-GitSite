import { modes, modeIndexFromPath } from "../navigation/modes.mjs";

const PAGE_TYPES = {
    WEB: "web",
    GAMEDEV: "gamedev",
    SOFTWARE: "software",
    RADIO: "radio",
    OTHER: "other",
};

const PAGE_NAMES = {
    HOME: "home",
};

const getPageFromPath = (pathname = window.location.pathname) => {
    return {
        type: modes[modeIndexFromPath(pathname)].id,

        page: PAGE_NAMES.HOME,
    };
};

export { PAGE_TYPES, PAGE_NAMES };
export default getPageFromPath;
