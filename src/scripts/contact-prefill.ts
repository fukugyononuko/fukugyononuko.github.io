// CMP-C01（閲覧時）：?service= の値を問い合わせフォームの選択欄に反映する（CC-04、DD-11）
// 値は選択肢にあるときだけ使い、HTML として書き込まない（NFR-15）。JavaScript が無効でもフォームは使える（NFR-10）。
const select = document.querySelector<HTMLSelectElement>("select[data-service-select]");
const requested = new URLSearchParams(location.search).get("service");
if (select && requested) {
  const option = Array.from(select.options).find((o) => o.value === requested);
  if (option) select.value = option.value;
}
