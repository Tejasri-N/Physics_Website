document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');

    // Search functionality for news and tables
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        // Filter news cards
        document.querySelectorAll('.news-card').forEach(card => {
            const content = card.textContent.toLowerCase();
            card.style.display = content.includes(searchTerm) ? 'block' : 'none';
        });

        // Filter opportunity tables
        document.querySelectorAll('.opportunity-table').forEach(table => {
            let hasVisibleRows = false;
            Array.from(table.tBodies[0].rows).forEach(row => {
                const match = row.textContent.toLowerCase().includes(searchTerm);
                row.style.display = match ? '' : 'none';
                if(match) hasVisibleRows = true;
            });

            const section = table.closest('.opportunity-section');
            section.style.display = hasVisibleRows ? 'block' : 'none';
        });
    });

    // Table sorting functionality
    document.querySelectorAll('.opportunity-table th').forEach(header => {
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const colIndex = this.cellIndex;
            const isAsc = !this.classList.contains('sorted-asc');

            sortTable(table, colIndex, isAsc);

            // Update sorting indicators
            table.querySelectorAll('th').forEach(th =>
                th.classList.remove('sorted-asc', 'sorted-desc')
            );
            this.classList.add(isAsc ? 'sorted-asc' : 'sorted-desc');
        });
    });

    function sortTable(table, col, ascending) {
        const tbody = table.tBodies[0];
        const rows = Array.from(tbody.rows);

        rows.sort((a, b) => {
            const aVal = a.cells[col].textContent.trim();
            const bVal = b.cells[col].textContent.trim();

            // Serial number column
            if(col === 0) {
                return ascending ? aVal - bVal : bVal - aVal;
            }
            // Date column
            if(col === 3) {
                return ascending ?
                    new Date(aVal) - new Date(bVal) :
                    new Date(bVal) - new Date(aVal);
            }
            // Text columns
            return ascending ?
                aVal.localeCompare(bVal) :
                bVal.localeCompare(aVal);
        });

        // Rebuild table
        while(tbody.firstChild) tbody.removeChild(tbody.firstChild);
        rows.forEach(row => tbody.appendChild(row));
    }
});
