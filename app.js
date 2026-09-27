const RELEASES = "https://api.github.com/repos/iamnotawhale/skterm-site/releases/latest";
const DOWNLOAD =
  "https://github.com/iamnotawhale/skterm-site/releases/latest/download/skterm_amd64.deb";

const versionEl = document.getElementById("version");
const downloadEl = document.getElementById("download");

downloadEl.href = DOWNLOAD;

async function loadLatest() {
  try {
    const res = await fetch(RELEASES, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const tag = (data.tag_name || "").replace(/^v/, "");
    if (tag && versionEl) versionEl.textContent = `v${tag}`;
  } catch {
    if (versionEl) versionEl.textContent = "latest";
  }
}

loadLatest();
