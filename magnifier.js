document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.magnifier-container').forEach(container => {
    const img = container.querySelector('.magnifier');

    // Create magnifier glass
    const glass = document.createElement('div');
    glass.classList.add('magnifier-glass');
    container.appendChild(glass);

    function updateGlassBackground() {
      const visibleImg = container.querySelector('.slides img:not([style*="display: none"])') || img;
      glass.style.backgroundImage = `url('${visibleImg.src}')`;
      glass.style.backgroundSize = `${visibleImg.width * 2}px ${visibleImg.height * 2}px`; // 2x zoom
    }

    // Move magnifier on mouse move
    container.addEventListener('mousemove', function(e) {
      glass.style.display = 'block';
      updateGlassBackground();

      const visibleImg = container.querySelector('.slides img:not([style*="display: none"])') || img;
      const rect = visibleImg.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      x = Math.max(0, Math.min(x, visibleImg.width));
      y = Math.max(0, Math.min(y, visibleImg.height));

      glass.style.left = `${x - glass.offsetWidth / 2}px`;
      glass.style.top = `${y - glass.offsetHeight / 2}px`;
      glass.style.backgroundPosition = `-${x * 2 - glass.offsetWidth / 2}px -${y * 2 - glass.offsetHeight / 2}px`;
    });

    container.addEventListener('mouseleave', function() {
      glass.style.display = 'none';
    });
  });
});
