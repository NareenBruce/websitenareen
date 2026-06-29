// === NAV: scroll glass effect ===
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 40)
})

// === NAV: hamburger mobile menu ===
const hamburger   = document.getElementById('hamburger')
const mobileMenu  = document.getElementById('mobileMenu')

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open')
  mobileMenu.classList.toggle('open', open)
})

// close mobile menu when a link is clicked
mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open')
    mobileMenu.classList.remove('open')
  })
})

// === FADE-UP: IntersectionObserver for scroll animations ===
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  },
  { threshold: 0.12 }
)

// add fade-up class to key elements then observe
const animateSelectors = [
  '.section__header',
  '.glass-card',
  '.project-card',
  '.contact__card',
]

animateSelectors.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('fade-up')
    el.style.setProperty('--i', i)
    observer.observe(el)
  })
})

// stagger project cards and skill tags
document.querySelectorAll('.projects__grid').forEach(grid => {
  grid.classList.add('stagger')
  grid.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.setProperty('--i', i)
  })
})

document.querySelectorAll('.skills-wrap').forEach(wrap => {
  wrap.classList.add('stagger')
  wrap.querySelectorAll('.skill-tag').forEach((tag, i) => {
    tag.classList.add('fade-up')
    tag.style.setProperty('--i', i)
    observer.observe(tag)
  })
})
