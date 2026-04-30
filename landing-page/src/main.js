// main.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Custom Cursor ---
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorOutline = document.querySelector('.cursor-outline');
  
  if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;
      
      // Update global CSS vars for Flashlight effect
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      
      // Add slight delay for the outline for a fluid feel
      setTimeout(() => {
        cursorOutline.style.left = `${e.clientX}px`;
        cursorOutline.style.top = `${e.clientY}px`;
      }, 50);
    });

    // Add hover state to interactive elements
    const interactables = document.querySelectorAll('a, button, .feature-card, .faq-item, .steps li');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // --- Theme Logic ---
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'light') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  };

  // Check for saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      
      // Simple Animation for theme switch
      themeToggle.style.transform = 'scale(1.2)';
      setTimeout(() => themeToggle.style.transform = 'scale(1)', 200);
    });
  }

  // --- Scroll Progress Bar ---
  const scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      scrollProgress.style.width = `${scrolled}%`;
    });
  }

  // --- Particles Background Generator ---
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      const size = Math.random() * 8 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `${Math.random() * 100}vh`;
      
      const delay = Math.random() * 5;
      const duration = Math.random() * 10 + 10;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      
      particlesContainer.appendChild(particle);
    }
  }

  // --- 3D Tilt Effect for Mockups & Cards (Vanilla JS Tilt) ---
  const tiltElements = document.querySelectorAll('.app-mockup, .feature-card');
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg
      const rotateY = ((x - centerX) / centerX) * 15;
      
      el.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
      el.style.transition = 'none';

      const glare = el.querySelector('.glare-fx');
      if (glare) {
        glare.style.transform = `translate(${x - centerX}px, ${y - centerY}px)`;
      }
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(1500px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
      el.style.transition = 'transform 0.5s ease-out';
      
      const glare = el.querySelector('.glare-fx');
      if (glare) {
        glare.style.transform = `translate(0, 0)`;
      }
    });
  });

  // --- Scroll Parallax & Navbar ---
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    // Parallax Variable
    document.documentElement.style.setProperty('--scroll', window.scrollY);

    // Navbar
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // --- Sticky Morph Logic ---
    const stickyWrapper = document.querySelector('.sticky-wrapper');
    if (stickyWrapper) {
      const rect = stickyWrapper.getBoundingClientRect();
      // Calculate progress from 0 to 1 as we scroll through the wrapper
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      
      const morphSteps = document.querySelectorAll('.morph-step');
      const morphImages = document.querySelectorAll('.morph-image');
      
      if (morphSteps.length > 0 && morphImages.length > 0) {
        // Determine which step is active (e.g. 0.0-0.33, 0.33-0.66, 0.66-1.0)
        const stepIndex = Math.min(Math.floor(progress * morphSteps.length), morphSteps.length - 1);
        
        morphSteps.forEach((el, idx) => {
          if (idx === stepIndex) el.classList.add('active');
          else el.classList.remove('active');
        });
        
        morphImages.forEach((el, idx) => {
          if (idx === stepIndex) el.classList.add('active');
          else el.classList.remove('active');
        });
      }
    }
  });

  // --- Magnetic Buttons ---
  const magneticBtns = document.querySelectorAll('.magnetic-btn');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
    });
  });

  // --- Scroll Animations (Intersection Observer) ---
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elementsToAnimate = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
  elementsToAnimate.forEach(el => {
    observer.observe(el);
  });

  // --- Smooth Page Transitions ---
  const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#') || this.target === '_blank') return;
      e.preventDefault();
      const href = this.href;
      document.body.classList.add('fade-out');
      setTimeout(() => {
        window.location.href = href;
      }, 500); 
    });
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.body.classList.remove('fade-out');
    }
  });

  // --- Waitlist Form Logic ---
  const waitlistForm = document.getElementById('waitlist-form');
  const waitlistSuccess = document.getElementById('waitlist-success');
  
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('waitlist-email').value;
      
      // Simulate API call
      console.log('Waitlist submission:', email);
      
      waitlistForm.style.transition = 'opacity 0.5s, transform 0.5s';
      waitlistForm.style.opacity = '0';
      waitlistForm.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        waitlistForm.style.display = 'none';
        waitlistSuccess.style.display = 'block';
        waitlistSuccess.style.opacity = '0';
        waitlistSuccess.style.transform = 'translateY(20px)';
        waitlistSuccess.style.transition = 'opacity 0.5s, transform 0.5s';
        
        // Force reflow
        void waitlistSuccess.offsetWidth;
        
        waitlistSuccess.style.opacity = '1';
        waitlistSuccess.style.transform = 'translateY(0)';
      }, 500);
    });
  }

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    }
  });
});
