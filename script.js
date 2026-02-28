// script.js — safe interactions: view toggle + mobile nav + CTA wiring

// helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// VIEW TOGGLE: student / startup
const viewStudent = $('#viewStudent');
const viewStartup = $('#viewStartup');
const primaryCTA = $('#primaryCTA');
const secondaryCTA = $('#secondaryCTA');
const featureTitle = $('#featureTitle');

function setView(type){
  if (type === 'student'){
    viewStudent && viewStudent.classList.add('active');
    viewStartup && viewStartup.classList.remove('active');
    // student-first copy (70% student focus)
    $('#hero-heading') && ($('#hero-heading').textContent = 'Real projects. Real pay. Verified experience.');
    $('#hero-sub') && ($('#hero-sub').textContent = 'Students complete short micro-projects for startups — earn money, ratings and employer-signed certificates that prove real work.');
    primaryCTA && (primaryCTA.href = 'signup.html') && (primaryCTA.textContent = 'Create student profile');
    secondaryCTA && (secondaryCTA.href = 'students.html') && (secondaryCTA.textContent = 'Hire a student');
    featureTitle && (featureTitle.textContent = 'Students: Build a verified work history');
  } else {
    viewStartup && viewStartup.classList.add('active');
    viewStudent && viewStudent.classList.remove('active');
    // startup-centric copy (30% focus)
    $('#hero-heading') && ($('#hero-heading').textContent = 'Hire motivated students. Save hiring cost.');
    $('#hero-sub') && ($('#hero-sub').textContent = 'Find affordable, capable students for short projects — quick turnarounds, flexible budgets, and verified certificates on delivery.');
    primaryCTA && (primaryCTA.href = 'post-offer.html') && (primaryCTA.textContent = 'Post a project');
    secondaryCTA && (secondaryCTA.href = 'students.html') && (secondaryCTA.textContent = 'Find students');
    featureTitle && (featureTitle.textContent = 'Startups: Hire skilled students quickly');
  }
}

// initial state: students-first (70/30)
setView('student');

if (viewStudent) viewStudent.addEventListener('click', ()=> setView('student'));
if (viewStartup) viewStartup.addEventListener('click', ()=> setView('startup'));

// allow keyboard activation
[viewStudent, viewStartup].forEach(btn=>{
  if (!btn) return;
  btn.setAttribute('tabindex','0');
  btn.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
  });
});

// MOBILE NAV TOGGLE
const mobileToggle = $('#mobileToggle');
const mainNav = $('#mainNav');
mobileToggle && mobileToggle.addEventListener('click', ()=>{
  const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
  mobileToggle.setAttribute('aria-expanded', String(!expanded));
  if (mainNav){
    mainNav.style.display = expanded ? 'none' : 'flex';
    mainNav.style.flexDirection = 'column';
    mainNav.style.gap = '10px';
    mainNav.style.marginTop = '10px';
  }
});

// CTA fallback smooth scroll: if linking to an in-page anchor, smooth scroll
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')){
      const el = document.querySelector(href);
      if (el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    }
  });
});

// defensive: ensure nav is visible on resize if switching between mobile/desktop
window.addEventListener('resize', ()=>{
  if (window.innerWidth > 980 && mainNav){
    mainNav.style.display = 'flex';
    mainNav.style.flexDirection = 'row';
  } else if (window.innerWidth <= 980 && mainNav){
    mainNav.style.display = 'none';
    mobileToggle && mobileToggle.setAttribute('aria-expanded','false');
  }
});
