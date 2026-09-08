class ElccRotator extends HTMLElement {
  connectedCallback() {
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.slides = [...this.querySelectorAll('[data-quote]')];
    this.dots = [...this.querySelectorAll('[data-quote-index]')];
    this.index = 0;
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.paused = this.motion.matches;
    this.querySelector('.elcc-quote-controls')?.removeAttribute('hidden');
    this.addEventListener('click', (event) => {
      const dot = event.target.closest('[data-quote-index]');
      if (dot) this.show(Number(dot.dataset.quoteIndex));
      if (event.target.closest('[data-quote-pause]')) { this.paused = !this.paused; this.schedule(); }
    }, { signal });
    this.addEventListener('pointerenter', () => { this.hovered = true; this.schedule(); }, { signal });
    this.addEventListener('pointerleave', () => { this.hovered = false; this.schedule(); }, { signal });
    this.addEventListener('focusin', () => { this.focused = true; this.schedule(); }, { signal });
    this.addEventListener('focusout', (event) => { this.focused = this.contains(event.relatedTarget); this.schedule(); }, { signal });
    this.motion.addEventListener('change', () => { this.paused = this.motion.matches; this.schedule(); }, { signal });
    document.addEventListener('visibilitychange', () => this.schedule(), { signal });
    this.addEventListener('shopify:block:select', (event) => {
      const slide = event.target.closest('[data-quote]');
      if (slide) { this.paused = true; this.show(this.slides.indexOf(slide)); }
    }, { signal });
    this.schedule();
  }

  show(index) {
    if (!this.slides.length || index < 0 || index >= this.slides.length) return;
    this.animation?.cancel();
    this.index = index;
    this.slides.forEach((slide, i) => { slide.hidden = i !== index; slide.inert = i !== index; });
    this.dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    if (!this.motion.matches && this.slides[index].animate) {
      this.animation = this.slides[index].animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
    }
    this.schedule();
  }

  schedule() {
    clearTimeout(this.timer);
    const control = this.querySelector('[data-quote-pause]');
    if (control) { control.textContent = this.paused ? this.dataset.playLabel : this.dataset.pauseLabel; control.setAttribute('aria-pressed', String(this.paused)); }
    if (this.paused || this.hovered || this.focused || document.hidden || this.slides.length < 2 || !this.isConnected) return;
    this.timer = setTimeout(() => this.show((this.index + 1) % this.slides.length), Math.max(3, Number(this.dataset.interval) || 7) * 1000);
  }

  disconnectedCallback() { this.controller?.abort(); clearTimeout(this.timer); this.animation?.cancel(); }
}

class ElccFaq extends HTMLElement {
  connectedCallback() {
    this.controller = new AbortController();
    this.dataset.enhanced = '';
    this.queue = Promise.resolve();
    this.addEventListener('click', (event) => {
      const summary = event.target.closest('summary');
      if (!summary || !this.contains(summary)) return;
      event.preventDefault();
      this.queue = this.queue.then(() => this.toggle(summary.parentElement));
    }, { signal: this.controller.signal });
    this.addEventListener('shopify:block:select', (event) => {
      const details = event.target.querySelector('details');
      if (details) this.queue = this.queue.then(() => this.toggle(details, true));
    }, { signal: this.controller.signal });
  }

  async toggle(details, forceOpen = false) {
    if (!this.isConnected) return;
    if (details.open && !forceOpen) return this.setOpen(details, false);
    for (const other of this.querySelectorAll('details[open]')) {
      if (other !== details) await this.setOpen(other, false);
    }
    if (this.isConnected) await this.setOpen(details, true);
  }

  async setOpen(details, open) {
    if (details.open === open) return;
    const start = details.getBoundingClientRect().height;
    const closed = details.querySelector('summary').getBoundingClientRect().height + 2;
    if (open) details.open = true;
    const end = open ? details.getBoundingClientRect().height : closed;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && details.animate) {
      this.animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 280, easing: 'ease-in-out' });
      try { await this.animation.finished; } catch { /* Section removal cancels the animation. */ }
    }
    details.open = open;
  }

  disconnectedCallback() { this.controller?.abort(); this.animation?.cancel(); delete this.dataset.enhanced; }
}

if (!customElements.get('elcc-rotator')) customElements.define('elcc-rotator', ElccRotator);
if (!customElements.get('elcc-faq')) customElements.define('elcc-faq', ElccFaq);
