// Layout coordinates exclude animated transforms/skew.
export function getElementPosition(element) {
    let position = 0;
    for (let current = element; current; current = current.offsetParent) position += current.offsetTop;
    return position;
}

export function getSectionPosition(element, offset = 0) {
    return Math.max(0, getElementPosition(element) + (Number(offset) || 0));
}

export function getScrollDuration(distance) {
    return Math.min(2 + Math.max(0, Math.abs(distance) - 600) / 600 * 0.6, 6);
}

export function getSamePageHash(anchor, currentHref) {
    if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return null;
    const url = new URL(anchor.href, currentHref);
    const current = new URL(currentHref);
    return url.origin === current.origin && url.pathname === current.pathname &&
        url.search === current.search && url.hash ? url.hash : null;
}
