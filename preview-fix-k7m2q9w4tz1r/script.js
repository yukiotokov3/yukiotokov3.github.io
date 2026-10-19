// Move focus to main content after using the skip link (improves some screen reader/browser combos).
document.addEventListener('DOMContentLoaded', function () {
  var skip = document.querySelector('.skip-link');
  var main = document.getElementById('main');
  if (skip && main) {
    skip.addEventListener('click', function () { main.focus(); });
  }
});
