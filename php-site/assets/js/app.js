(function () {
  var slides = document.querySelectorAll("[data-slide]");
  var dots = document.querySelectorAll("[data-dot]");
  if (!slides.length) return;
  var index = 0;
  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === index); });
    dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === index); });
  }
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () { show(Number(dot.getAttribute("data-dot"))); });
  });
  setInterval(function () { show(index + 1); }, 5000);
})();

document.getElementById("add-option")?.addEventListener("click", function () {
  var wrap = document.getElementById("options");
  if (!wrap) return;
  var row = document.createElement("div");
  row.className = "option-row";
  row.innerHTML = '<input name="opt_label[]" placeholder="عنوان، مثلا کارتن">' +
    '<input name="opt_code[]" placeholder="کد، مثلا carton">' +
    '<input name="opt_price[]" inputmode="numeric" placeholder="قیمت تومان">';
  wrap.appendChild(row);
});
