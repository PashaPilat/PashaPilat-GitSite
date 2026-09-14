const PAGE_TYPES = {
    WEB: "web",
    UNITY: "unity",
};

const PAGE_NAMES = {
    HOME: "home",
};

const getPageFromPath = (pathname = window.location.pathname) => {
    const segments = pathname.split("/").filter(Boolean);

    return {
        type: segments.includes("unity")
            ? PAGE_TYPES.UNITY
            : PAGE_TYPES.WEB,

        page: PAGE_NAMES.HOME,
    };
};

export { PAGE_TYPES, PAGE_NAMES };
export default getPageFromPath;