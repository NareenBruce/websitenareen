// === HERO: cursor-reactive background ===
;(() => {
  const heroEl   = document.getElementById('home')
  const glowEl   = heroEl.querySelector('.hero__cursor-glow')
  const orbs     = heroEl.querySelectorAll('.hero__orb')

  // parallax depth per orb [x-factor, y-factor] in px
  const factors  = [[-28, -20], [22, 18], [-14, 12]]

  let tx = 0.5, ty = 0.5   // target (0-1)
  let gx = 0.5, gy = 0.5   // current glow position
  const ox = [0, 0, 0], oy = [0, 0, 0]  // current orb offsets

  const lerp = (a, b, t) => a + (b - a) * t

  heroEl.addEventListener('mousemove', e => {
    const r = heroEl.getBoundingClientRect()
    tx = (e.clientX - r.left)  / r.width
    ty = (e.clientY - r.top)   / r.height
  })
  heroEl.addEventListener('mouseleave', () => { tx = 0.5; ty = 0.5 })

  function tick() {
    gx = lerp(gx, tx, 0.07)
    gy = lerp(gy, ty, 0.07)

    // spotlight follows cursor
    glowEl.style.background =
      `radial-gradient(circle 55rem at ${(gx*100).toFixed(2)}% ${(gy*100).toFixed(2)}%,` +
      `rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.09) 38%, transparent 65%)`

    // orbs parallax — margin offset doesn't fight the float animation transform
    const dx = gx - 0.5, dy = gy - 0.5
    orbs.forEach((orb, i) => {
      ox[i] = lerp(ox[i], dx * factors[i][0], 0.05)
      oy[i] = lerp(oy[i], dy * factors[i][1], 0.05)
      orb.style.marginLeft = ox[i].toFixed(2) + 'px'
      orb.style.marginTop  = oy[i].toFixed(2) + 'px'
    })

    requestAnimationFrame(tick)
  }
  tick()
})()

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
