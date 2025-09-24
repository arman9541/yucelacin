// slider.js
(function(){
  // Show/hide slides for a given slider (btn can be passed from inline onclick)
  function plusSlides(n, btn) {
    const slider = btn && btn.closest ? btn.closest('.slider') : null;
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('.slides img'));
    if (!slides.length) return;

    // find current slide (inline style preferred), fallback to first visible via computed style
    let current = slides.findIndex(img => img.style.display === "block");
    if (current === -1) {
      current = slides.findIndex(img => window.getComputedStyle(img).display !== "none");
      if (current === -1) current = 0;
    }

    slides[current].style.display = "none";
    const nextIndex = (current + n + slides.length) % slides.length;
    slides[nextIndex].style.display = "block";

    // store current index on slider for other usages if needed
    slider.__current = nextIndex;
  }

  // Initialize sliders on DOM ready and expose plusSlides globally
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.slider .slides').forEach(slideContainer => {
      const imgs = slideContainer.querySelectorAll('img');
      imgs.forEach((img, i) => {
        img.style.display = i === 0 ? "block" : "none";
      });
    });

    // make function available for inline onclick handlers
    window.plusSlides = plusSlides;
  });
})();
