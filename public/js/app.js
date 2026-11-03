// Small progressive enhancements for Shiftly pages. Everything works without JS
// except the confirmation prompts and table sorting.
(function () {
  'use strict';

  // Ask before destructive actions: <form data-confirm="Are you sure?">
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });

  // Click a heading in a <table data-sortable> to sort by that column.
  document.querySelectorAll('table[data-sortable]').forEach(function (table) {
    var headings = Array.prototype.slice.call(table.tHead.rows[0].cells);
    headings.forEach(function (th, index) {
      if (!th.hasAttribute('data-sort')) return;
      th.classList.add('sortable');
      th.addEventListener('click', function () {
        var direction = th.dataset.direction === 'desc' ? 'asc' : 'desc';
        headings.forEach(function (other) {
          delete other.dataset.direction;
        });
        th.dataset.direction = direction;

        var body = table.tBodies[0];
        var rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = a.cells[index].textContent.trim();
          var y = b.cells[index].textContent.trim();
          return direction === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
        });
        rows.forEach(function (row) {
          body.appendChild(row);
        });
      });
    });
  });

  // Bring a just-saved shift into view on the rota.
  if (location.hash.indexOf('#shift-') === 0) {
    var chip = document.querySelector(location.hash);
    if (chip) {
      chip.classList.add('flash-highlight');
      chip.scrollIntoView({ block: 'center', inline: 'center' });
    }
  }
})();
