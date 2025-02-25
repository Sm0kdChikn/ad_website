document.querySelector('.hamburger').addEventListener('click', function () {
    const navMenu = document.querySelector('.nav-menu');
    const hamburgerIcon = document.querySelector('.hamburger-icon');

    navMenu.classList.toggle('active');

    // Switch between hamburger (☰) and close (✕)
    if (navMenu.classList.contains('active')) {
        hamburgerIcon.textContent = '✕';
    } else {
        hamburgerIcon.textContent = '☰';
    }
});