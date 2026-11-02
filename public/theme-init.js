// Resuelve el tema antes de pintar, igual que OpenArg: preferencia guardada,
// preferencia clara del sistema y, por defecto, oscuro. Es un archivo externo
// porque la CSP no permite scripts inline.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('mendoza-theme') || localStorage.getItem('pba-theme');
  } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
