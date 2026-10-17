// CMP-C01（閲覧時）：記事のページの「リンクをコピー」（FR-15、DD-11）
// ボタンは hidden で出力し、クリップボードが使えるときだけ表示する（JavaScript が無効なら出ない。NFR-10）。
// 結果は textContent で書き、HTML として書き込まない（NFR-15）。
if (navigator.clipboard) {
  for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-copy-url]")) {
    const status = button.closest("[data-share]")?.querySelector<HTMLElement>("[data-copy-status]");
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyUrl ?? "");
        if (status) status.textContent = "リンクをコピーしました";
      } catch {
        if (status) status.textContent = "コピーできませんでした";
      }
    });
  }
}
