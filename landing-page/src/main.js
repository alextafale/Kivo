// main.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileMenuBtn.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileMenuBtn.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        mobileMenuBtn.classList.remove('active');
      }
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

  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setTheme(currentTheme === 'light' ? 'dark' : 'light');
      themeToggle.style.transform = 'scale(1.2)';
      setTimeout(() => themeToggle.style.transform = 'scale(1)', 200);
    });
  }

  // --- Scroll Progress Bar (passive + throttled) ---
  const scrollProgress = document.querySelector('.scroll-progress');
  if (scrollProgress) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          scrollProgress.style.width = `${(window.scrollY / windowHeight) * 100}%`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- Particles Background (reduced to 20) ---
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 6 + 2;
      particle.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}vw;
        top:${Math.random() * 100}vh;
        animation-delay:${Math.random() * 5}s;
        animation-duration:${Math.random() * 10 + 15}s;
      `;
      fragment.appendChild(particle);
    }
    particlesContainer.appendChild(fragment);
  }

  // --- 3D Tilt Effect (throttled with rAF) ---
  const tiltElements = document.querySelectorAll('.app-mockup, .feature-card');
  tiltElements.forEach(el => {
    let tiltRaf = null;
    el.addEventListener('mousemove', (e) => {
      if (tiltRaf) return;
      tiltRaf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / rect.height) * -12;
        const rotateY = ((x - rect.width / 2) / rect.width) * 12;
        el.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;
        el.style.transition = 'none';
        const glare = el.querySelector('.glare-fx');
        if (glare) glare.style.transform = `translate(${x - rect.width/2}px, ${y - rect.height/2}px)`;
        tiltRaf = null;
      });
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      el.style.transition = 'transform 0.4s ease-out';
      const glare = el.querySelector('.glare-fx');
      if (glare) glare.style.transform = 'translate(0,0)';
    });
  });

  // --- Scroll: Navbar + Parallax + Sticky Morph (single listener, throttled) ---
  const navbar = document.querySelector('.navbar');
  let scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // CSS var for parallax
        document.documentElement.style.setProperty('--scroll', scrollY);

        // Navbar
        if (navbar) {
          navbar.classList.toggle('scrolled', scrollY > 50);
        }

        // Sticky Morph
        const stickyWrapper = document.querySelector('.sticky-wrapper');
        if (stickyWrapper) {
          const rect = stickyWrapper.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
          const morphSteps = document.querySelectorAll('.morph-step');
          const morphImages = document.querySelectorAll('.morph-image');
          if (morphSteps.length > 0 && morphImages.length > 0) {
            const stepIndex = Math.min(Math.floor(progress * morphSteps.length), morphSteps.length - 1);
            morphSteps.forEach((el, idx) => el.classList.toggle('active', idx === stepIndex));
            morphImages.forEach((el, idx) => el.classList.toggle('active', idx === stepIndex));
          }
        }

        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

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
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px', threshold: 0.08 });

  document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => observer.observe(el));

  // --- Lazy load images below the fold ---
  document.querySelectorAll('img:not([loading])').forEach((img, i) => {
    if (i > 0) img.setAttribute('loading', 'lazy'); // first image eager, rest lazy
  });

  // --- Smooth Page Transitions (250ms instead of 500ms) ---
  const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#') || this.target === '_blank') return;
      e.preventDefault();
      const href = this.href;
      document.body.classList.add('fade-out');
      setTimeout(() => { window.location.href = href; }, 250);
    });
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.body.classList.remove('fade-out');
  });

  // --- Waitlist Form Logic ---
  const waitlistForm = document.getElementById('waitlist-form');
  const waitlistSuccess = document.getElementById('waitlist-success');
  
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('waitlist-email').value;
      console.log('Waitlist submission:', email);
      
      waitlistForm.style.transition = 'opacity 0.3s, transform 0.3s';
      waitlistForm.style.opacity = '0';
      waitlistForm.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        waitlistForm.style.display = 'none';
        waitlistSuccess.style.display = 'block';
        waitlistSuccess.style.opacity = '0';
        waitlistSuccess.style.transform = 'translateY(20px)';
        waitlistSuccess.style.transition = 'opacity 0.3s, transform 0.3s';
        void waitlistSuccess.offsetWidth;
        waitlistSuccess.style.opacity = '1';
        waitlistSuccess.style.transform = 'translateY(0)';
      }, 300);
    });
  }

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(other => { if (other !== item) other.classList.remove('active'); });
        item.classList.toggle('active');
      });
    }
  });
});
