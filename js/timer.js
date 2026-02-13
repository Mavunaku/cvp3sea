/**
 * CVP Properties - Slider Timer Logic
 * Handles the automatic 6-second transition for the homepage slider.
 * Uses CSS opacity transitions via the '.active' class instead of display:none.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Select all slides
    const slides = document.querySelectorAll('.sl-slide');

    // Exit if no slides found
    if (slides.length === 0) return;

    let currentSlide = 0;
    const slideInterval = 6000; // 6000ms = 6 seconds

    // Initialize: Ensure the first slide has the active class, others do not.
    slides.forEach((slide, index) => {
        if (index === 0) {
            slide.classList.add('active');
            slide.style.opacity = '1';
            slide.style.visibility = 'visible';
            slide.style.zIndex = '2';
        } else {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.visibility = 'hidden';
            slide.style.zIndex = '1';
        }
    });

    // Function to move to the next slide
    const nextSlide = () => {
        const previousSlide = currentSlide;
        currentSlide = (currentSlide + 1) % slides.length;

        // Fade Out Previous
        slides[previousSlide].classList.remove('active');
        slides[previousSlide].style.opacity = '0';
        slides[previousSlide].style.visibility = 'hidden';
        slides[previousSlide].style.zIndex = '1';

        // Fade In Next
        slides[currentSlide].classList.add('active');
        slides[currentSlide].style.opacity = '1';
        slides[currentSlide].style.visibility = 'visible';
        slides[currentSlide].style.zIndex = '2';
    };

    // Start the interval
    setInterval(nextSlide, slideInterval);
});