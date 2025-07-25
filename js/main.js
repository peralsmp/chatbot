document.addEventListener("DOMContentLoaded", () => {
    // --- Scroll Animation ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                // Optional: remove class to re-animate on scroll up
                // entry.target.classList.remove('show');
            }
        });
    });

    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    // --- Persistent Theme Loading ---
    // This part is duplicated in chat.js to ensure theme persistence
    // on all pages. A better approach for larger sites is a single shared JS file.
    const theme = localStorage.getItem('theme');
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if(themeSwitch) themeSwitch.checked = false; // Assuming dark is default/checked
    } else {
        document.body.classList.remove('light-theme');
        if(themeSwitch) themeSwitch.checked = true;
    }
});