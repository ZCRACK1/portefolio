// Animations et gestion des boutons : smooth scroll, active nav, reveal, typing, validation et actions boutons
document.addEventListener('DOMContentLoaded', () => {
    /* helpers */
    const smoothScrollTo = (el) => {
        const target = (typeof el === 'string') ? document.querySelector(el) : el;
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const createToast = (text, timeout = 2500) => {
        const t = document.createElement('div');
        t.textContent = text;
        Object.assign(t.style, {
            position: 'fixed', right: '20px', bottom: '20px',
            background: 'rgba(0,0,0,0.8)', color: '#fff',
            padding: '10px 14px', borderRadius: '8px', zIndex: 9999
        });
        document.body.appendChild(t);
        setTimeout(() => t.remove(), timeout);
    };

    /* smooth scroll for nav links */
    document.querySelectorAll('nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo(link.getAttribute('href'));
        });
    });

    /* active nav link using IntersectionObserver */
    const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
    const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (sections.length) {
        const activeObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.target.id) return;
                const id = '#' + entry.target.id;
                navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id && entry.isIntersecting));
            });
        }, { threshold: 0.5 });
        sections.forEach(s => activeObs.observe(s));
    }

    /* reveal on scroll */
    const revealSelector = '.reveal, .project, .bloc > div, #contact form, #about img, .intro';
    const revealEls = Array.from(document.querySelectorAll(revealSelector));
    if (revealEls.length) {
        const revealObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => { el.classList.add('reveal'); revealObs.observe(el); });
    }

    /* typing effect for #prenom */
    const nameEl = document.getElementById('prenom');
    if (nameEl) {
        const full = nameEl.textContent.trim();
        nameEl.textContent = '';
        let i = 0;
        const speed = 80;
        const typer = setInterval(() => {
            if (i < full.length) nameEl.textContent += full.charAt(i++);
            else clearInterval(typer);
        }, speed);
    }

    /* Form handling (validation + message) */
    const form = document.querySelector('#contact form');
    if (form) {
        form.addEventListener('submit', (e) => {
            const name = form.querySelector('#name');
            const email = form.querySelector('#email');
            const msg = form.querySelector('#message');
            if (!name || !email || !msg) return;
            if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
                e.preventDefault();
                createToast('Veuillez remplir tous les champs du formulaire.');
                return;
            }
            // si tu veux envoyer réellement, n'empêche pas l'envoi.
            // Ici on empêche l'envoi et affiche confirmation (ajuste selon ton backend)
            e.preventDefault();
            createToast('Message envoyé — merci !');
            form.reset();
        });
    }

    /* Gestion centralisée des boutons via data-* attributes */
    document.body.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;

        // data-scroll-to="#id" ou "projects" (sans #)
        if (btn.dataset.scrollTo) {
            ev.preventDefault();
            const sel = btn.dataset.scrollTo.startsWith('#') ? btn.dataset.scrollTo : `#${btn.dataset.scrollTo}`;
            smoothScrollTo(sel);
            return;
        }

        // data-url -> ouvrir lien dans nouvel onglet
        if (btn.dataset.url) {
            ev.preventDefault();
            window.open(btn.dataset.url, '_blank', 'noopener');
            return;
        }

        // data-action="project-detail" data-images="img1.jpg,img2.jpg"
        if (btn.dataset.action === 'project-detail') {
            ev.preventDefault();
            const title = btn.dataset.title || 'Détail du projet';
            const desc = btn.dataset.desc || 'Description non fournie.';
            const images = (btn.dataset.images || '').split(',').map(s => s.trim()).filter(Boolean);

            // create modal
            const modal = document.createElement('div');
            modal.className = 'pf-modal';
            modal.innerHTML = `
                <div class="pf-modal__dialog" role="dialog" aria-modal="true" aria-label="${title}">
                    <button class="pf-modal__close" aria-label="Fermer">&times;</button>
                    <div class="pf-modal__media">
                        <button class="pf-prev" aria-label="Image précédente">&#10094;</button>
                        <div class="pf-media__wrap">
                            ${images.length ? images.map((src,i) =>
                                `<img src="${src}" class="pf-media__img ${i===0? 'active' : ''}" alt="${title} image ${i+1}">`
                            ).join('') : `<div class="pf-noimg">Aucune image</div>`}
                        </div>
                        <button class="pf-next" aria-label="Image suivante">&#10095;</button>
                    </div>
                    <div class="pf-modal__body">
                        <h3>${title}</h3>
                        <p>${desc}</p>
                        <div class="pf-thumbs">
                            ${images.map((src,i) => `<button class="pf-thumb ${i===0?'active':''}" data-index="${i}"><img src="${src}" alt="mini ${i+1}"></button>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const imgs = Array.from(modal.querySelectorAll('.pf-media__img'));
            const thumbs = Array.from(modal.querySelectorAll('.pf-thumb'));
            const prev = modal.querySelector('.pf-prev');
            const next = modal.querySelector('.pf-next');
            const close = modal.querySelector('.pf-modal__close');
            let idx = 0;

            const update = (newIdx) => {
                if (!imgs.length) return;
                idx = (newIdx + imgs.length) % imgs.length;
                imgs.forEach((el,i) => el.classList.toggle('active', i===idx));
                thumbs.forEach((t,i) => t.classList.toggle('active', i===idx));
                // ensure visible (in case of overflow)
                if (thumbs[idx]) thumbs[idx].scrollIntoView({inline: 'center', behavior: 'smooth'});
            };

            prev.addEventListener('click', () => update(idx-1));
            next.addEventListener('click', () => update(idx+1));
            thumbs.forEach(t => t.addEventListener('click', () => update(Number(t.dataset.index))));
            close.addEventListener('click', () => modal.remove());

            // close on overlay click
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            // keyboard nav
            const keyHandler = (e) => {
                if (e.key === 'Escape') modal.remove();
                if (e.key === 'ArrowLeft') update(idx-1);
                if (e.key === 'ArrowRight') update(idx+1);
            };
            document.addEventListener('keydown', keyHandler);

            // cleanup on remove
            const obs = new MutationObserver(() => {
                if (!document.body.contains(modal)) {
                    document.removeEventListener('keydown', keyHandler);
                    obs.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });

            // focus management
            close.focus();
            return;
        }

        // fallback : si bouton a class .project-button -> scroll to projects
        if (btn.classList.contains('project-button')) {
            ev.preventDefault();
            smoothScrollTo('#projects');
        }
    });

    // accessibilité : activer les boutons au clavier (Enter)
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const el = document.activeElement;
            if (el && el.tagName === 'BUTTON') el.click();
        }
    });
});