// This file will handle any interactive elements for the website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Initialize fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Once the element is visible, we don't need to observe it anymore
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null, // Use viewport as root
        rootMargin: '0px 0px -10% 0px', // Start animation slightly before element comes into view
        threshold: 0.1 // Trigger when at least 10% of the element is visible
    });

    // Start observing all fade-in elements
    fadeElements.forEach(element => {
        fadeInObserver.observe(element);
    });

    // Initialize any necessary JavaScript functionality
    
    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.main-nav');
    const body = document.body;
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            body.classList.toggle('menu-open'); // Prevents scrolling when menu is open
        });
    }
    
    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });
    
    // Smooth scrolling for navigation links
    const links = document.querySelectorAll('a[href^="#"]');
    
    for (const link of links) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                lenis.scrollTo(targetElement, {
                    offset: -80, // Account for header height
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            }
        });
    }
    
    // Initialize carousel functionality
    initCarousel();
    
    // FAQ Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Open the first FAQ item by default
    if (faqItems.length > 0) {
        faqItems[0].classList.add('active');
    }
    
    // Add 3D hover effect for hero background image
    const hero = document.querySelector('.hero');
    
    if (hero) {
        hero.addEventListener('mousemove', function(e) {
            // Get mouse position relative to the hero section
            const rect = hero.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; 
            const mouseY = e.clientY - rect.top;
            
            // Calculate rotation based on mouse position
            // Convert mouse position to percentage of hero width/height
            const xRotation = ((mouseY / rect.height) - 0.5) * 10; // -2.5 to 5 degrees
            const yRotation = ((mouseX / rect.width) - 0.5) * -10; // -2.5 to 5 degrees
            
            // Apply the transform to the pseudo-element
            // We need to use a CSS variable since we can't directly access pseudo-elements in JS
            hero.style.setProperty('--x-rotation', `${xRotation}deg`);
            hero.style.setProperty('--y-rotation', `${yRotation}deg`);
        });
        
        // Reset transform when mouse leaves
        hero.addEventListener('mouseleave', function() {
            hero.style.setProperty('--x-rotation', '0deg');
            hero.style.setProperty('--y-rotation', '0deg');
        });
    }
});

function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const cards = track.querySelectorAll('.fundamental-card');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    if (!track || !cards.length) return;
    
    let currentIndex = 0;
    let cardsPerView = getCardsPerView();
    const totalSlides = Math.ceil(cards.length / cardsPerView);
    
    // Drag functionality variables
    let isDragging = false;
    let startPosition = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let activeCard = null; // Track which card is currently active
    let animationID = 0;
    let lastDragTime = 0;
    let dragVelocity = 0;
    
    // Set initial button states
    updateNavigation();
    
    // Add event listeners for buttons
    prevButton.addEventListener('click', () => {
        navigate(-1);
    });
    
    nextButton.addEventListener('click', () => {
        navigate(1);
    });
    
    // Add drag event listeners
    track.addEventListener('mousedown', dragStart);
    track.addEventListener('touchstart', dragStart, { passive: false });
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: false });
    
    // Prevent context menu on long press
    track.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        cardsPerView = getCardsPerView();
        navigate(0); // Recalculate position
    });
    
    function dragStart(e) {
        // Stop any ongoing animation
        cancelAnimationFrame(animationID);
        
        if (e.type === 'touchstart') {
            startPosition = e.touches[0].clientX;
        } else {
            startPosition = e.clientX;
            e.preventDefault(); // Prevent text selection during drag
        }
        
        isDragging = true;
        lastDragTime = Date.now();
        dragVelocity = 0;
        
        // Find the card that was clicked
        let target = e.target;
        while (target !== track && !target.classList.contains('fundamental-card')) {
            target = target.parentNode;
            if (!target) break;
        }
        
        // Only apply shrink effect to the clicked card
        if (target && target.classList.contains('fundamental-card')) {
            activeCard = target;
            activeCard.classList.add('shrink');
        }
        
        // Start animation loop
        animationID = requestAnimationFrame(animation);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let currentPosition;
        if (e.type === 'touchmove') {
            currentPosition = e.touches[0].clientX;
            e.preventDefault(); // Prevent page scrolling during drag
        } else {
            currentPosition = e.clientX;
        }
        
        const diff = currentPosition - startPosition;
        const now = Date.now();
        const elapsed = now - lastDragTime;
        
        // Calculate drag velocity for momentum
        if (elapsed > 0) {
            dragVelocity = diff / elapsed;
        }
        
        lastDragTime = now;
        
        // Add resistance at the edges
        if ((currentIndex === 0 && diff > 0) || 
            (currentIndex === totalSlides - 1 && diff < 0)) {
            // Reduce the effect of dragging at the edges with progressive resistance
            const resistance = 0.3 - (Math.abs(diff) / 1000); // More resistance as you drag further
            currentTranslate = prevTranslate + (diff * Math.max(0.1, resistance));
        } else {
            currentTranslate = prevTranslate + diff;
        }
    }
    
    function dragEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        cancelAnimationFrame(animationID);
        
        // Remove shrink effect from the active card
        if (activeCard) {
            activeCard.classList.remove('shrink');
            activeCard = null;
        }
        
        const cardWidth = cards[0].offsetWidth + parseFloat(getComputedStyle(cards[0]).marginRight);
        const movedBy = currentTranslate - prevTranslate;
        
        // Apply momentum-based scrolling
        const momentumThreshold = Math.abs(dragVelocity) > 0.5;
        
        if (Math.abs(movedBy) > Math.min(50, cardWidth / 5) || momentumThreshold) {
            // Determine direction based on movement and velocity
            let direction = 0;
            
            if (Math.abs(movedBy) > 10) {
                // Direction based on drag distance
                direction = movedBy > 0 ? -1 : 1;
            } else if (momentumThreshold) {
                // Direction based on velocity
                direction = dragVelocity > 0 ? -1 : 1;
            }
            
            navigate(direction);
        } else {
            // Snap back to current position
            navigate(0);
        }
        
        prevTranslate = currentTranslate;
    }
    
    function animation() {
        if (isDragging) {
            setSliderPosition();
            animationID = requestAnimationFrame(animation);
        }
    }
    
    function setSliderPosition() {
        track.scrollLeft = -currentTranslate;
    }
    
    function navigate(direction) {
        // Calculate the new index based on single card navigation
        const newIndex = currentIndex + direction;
        
        // Ensure the new index is within bounds
        if (newIndex < 0 || newIndex > cards.length - cardsPerView) {
            return;
        }
        
        currentIndex = newIndex;
        
        // Calculate card width including gap
        const gap = parseFloat(getComputedStyle(track).gap);
        const containerWidth = track.clientWidth;
        let cardWidth;
        
        // Calculate card width based on viewport
        if (window.innerWidth > 1024) {
            // Desktop: 3 cards
            cardWidth = (containerWidth - gap * 2) / 3;
        } else if (window.innerWidth > 768) {
            // Tablet: 2 cards
            cardWidth = (containerWidth - gap) / 2;
        } else {
            // Mobile: 1 card
            cardWidth = containerWidth;
        }
        
        // Calculate scroll position including gap
        const scrollPosition = currentIndex * (cardWidth + gap);
        
        track.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        
        // Update drag tracking variables
        currentTranslate = -scrollPosition;
        prevTranslate = -scrollPosition;
        
        updateNavigation();
    }
    
    function updateNavigation() {
        // Update buttons
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= cards.length - cardsPerView;
        
        // Calculate total number of dots needed based on viewport
        const totalDots = cards.length - (getCardsPerView() - 1);
        
        // Update dots container
        const dotsContainer = document.querySelector('.carousel-dots');
        
        // Clear existing dots
        dotsContainer.innerHTML = '';
        
        // Create new dots based on viewport
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (i === currentIndex) {
                dot.classList.add('active');
            }
            dotsContainer.appendChild(dot);
            
            // Add click event to each dot
            dot.addEventListener('click', () => {
                const diff = i - currentIndex;
                if (diff !== 0) {
                    navigate(diff);
                }
            });
        }
    }
    
    function getCardsPerView() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth < 768) return 1;     // Mobile: 1 card
        if (viewportWidth < 1024) return 2;    // Tablet: 2 cards
        return 3;                              // Desktop: 3 cards
    }
} 