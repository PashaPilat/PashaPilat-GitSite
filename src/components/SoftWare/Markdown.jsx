import React from "react";

function inline(text, keyBase) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
        const key = `${keyBase}-${i}`;
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>;
        if (/^`[^`]+`$/.test(part)) return <code key={key}>{part.slice(1, -1)}</code>;
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
            const external = /^https?:/.test(link[2]);
            return <a key={key} href={external ? link[2] : "#"} target={external ? "_blank" : undefined} rel="noopener noreferrer" onClick={external ? undefined : (e) => e.preventDefault()}>{link[1]}</a>;
        }
        return part;
    });
}

export function parseMarkdown(md) {
    const lines = md.split("\n");
    const blocks = [];
    const toc = [];
    let para = [];
    let list = null;

    const flushPara = () => { if (para.length) { blocks.push({ t: "p", text: para.join(" ") }); para = []; } };
    const flushList = () => { if (list) { blocks.push(list); list = null; } };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("```")) {
            flushPara(); flushList();
            const lang = line.slice(3).trim();
            const code = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
            blocks.push({ t: "code", lang, text: code.join("\n") });
            continue;
        }
        const h = line.match(/^(#{2,4})\s+(.*)$/);
        if (h) {
            flushPara(); flushList();
            const level = h[1].length;
            const id = `md-${blocks.length}`;
            blocks.push({ t: `h${level}`, text: h[2], id });
            if (level === 2) toc.push({ id, text: h[2] });
            continue;
        }
        const li = line.match(/^\s*(-|\d+\.)\s+(.*)$/);
        if (li) {
            flushPara();
            const ordered = li[1] !== "-";
            if (!list || list.ordered !== ordered) { flushList(); list = { t: "list", ordered, items: [] }; }
            list.items.push(li[2]);
            continue;
        }
        if (!line.trim()) { flushPara(); flushList(); continue; }
        flushList();
        para.push(line.trim());
    }
    flushPara(); flushList();
    return { blocks, toc };
}

export default function Markdown({ blocks }) {
    return blocks.map((b, i) => {
        const headingNum = String((i + 1)).padStart(2, "0");
        switch (b.t) {
            case "h2":
                return <h2 key={i} id={b.id}><span aria-hidden="true">{headingNum}</span>{inline(b.text, i)}</h2>;
            case "h3":
                return <h3 key={i} id={b.id}><span aria-hidden="true">{headingNum}</span>{inline(b.text, i)}</h3>;
            case "h4":
                return <h4 key={i} id={b.id}>{inline(b.text, i)}</h4>;
            case "code":
                return (
                    <div key={i} className="md-code">
                        <div className="md-code__bar" aria-hidden="true"><span>{b.lang || "shell"}</span></div>
                        <pre><code>{b.text}</code></pre>
                    </div>
                );
            case "list": {
                const Tag = b.ordered ? "ol" : "ul";
                return <Tag key={i}>{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</Tag>;
            }
            default:
                return <p key={i}>{inline(b.text, i)}</p>;
        }
    });
}
