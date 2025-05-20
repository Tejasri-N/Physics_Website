let currentSort = { column: null, direction: 'asc' };
const numericColumns = new Set([5]); // Year column index (0-based)

function updateSerialNumbers() {
    const rows = document.querySelectorAll('#archiveTable tbody tr');
    let count = 1;
    rows.forEach(row => {
        if (row.style.display !== 'none') {
            row.cells[0].textContent = count++;
        } else {
            row.cells[0].textContent = '';
        }
    });
}

function sortTable(columnIndex) {
    const table = document.getElementById('archiveTable');
    const tbody = table.tBodies[0];
    const headers = table.tHead.rows[0].cells;
    const isNumeric = numericColumns.has(columnIndex);

    // Remove sort highlighting and reset indicators
    for (let th of headers) {
        th.classList.remove('sorted', 'sorted-asc', 'sorted-desc');
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = '↕';
    }

    // Toggle sort direction or set to ascending if new column
    if (currentSort.column === columnIndex) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = columnIndex;
        currentSort.direction = 'asc';
    }

    // Set arrow for sorted column
    const sortedTh = headers[columnIndex];
    sortedTh.classList.add('sorted');
    const indicator = sortedTh.querySelector('.sort-indicator');
    if (indicator) {
        if (currentSort.direction === 'asc') {
            sortedTh.classList.add('sorted-asc');
            indicator.textContent = '↑';
        } else {
            sortedTh.classList.add('sorted-desc');
            indicator.textContent = '↓';
        }
    }

    // Get and sort rows
    const rows = Array.from(tbody.rows);
    rows.sort((a, b) => {
        let aText = a.cells[columnIndex].textContent.trim();
        let bText = b.cells[columnIndex].textContent.trim();

        if (isNumeric) {
            aText = parseInt(aText, 10);
            bText = parseInt(bText, 10);
            if (isNaN(aText)) aText = 0;
            if (isNaN(bText)) bText = 0;
            return currentSort.direction === 'asc' ? aText - bText : bText - aText;
        } else {
            return currentSort.direction === 'asc'
                ? aText.localeCompare(bText)
                : bText.localeCompare(aText);
        }
    });

    for (const row of rows) {
        tbody.appendChild(row);
    }
    updateSerialNumbers();
}


// --- Search/Filter Logic ---
document.getElementById('searchInput').addEventListener('input', function(e) {
    const filter = e.target.value.toUpperCase();
    const rows = document.querySelectorAll('#archiveTable tbody tr');
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let match = false;
        for (let cell of cells) {
            if (cell.textContent.toUpperCase().indexOf(filter) > -1) {
                match = true;
                break;
            }
        }
        row.style.display = match ? '' : 'none';
    });
    updateSerialNumbers();
});

// --- Download Link Tracking ---
function setupDownloadTracking() {
    document.querySelectorAll('.download-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const row = this.closest('tr');
            const docTitle = row ? row.cells[2].textContent : 'Unknown';
            console.log(`Downloaded: ${docTitle}`);
        });
    });
}

// --- Responsive Table: Add data-labels for mobile ---
function addDataLabels() {
    const table = document.getElementById('archiveTable');
    const headers = Array.from(table.tHead.rows[0].cells).map(th => th.textContent.trim());
    for (let row of table.tBodies[0].rows) {
        for (let i = 0; i < row.cells.length; i++) {
            row.cells[i].setAttribute('data-label', headers[i]);
        }
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    addDataLabels();
    setupDownloadTracking();
    updateSerialNumbers();
});
