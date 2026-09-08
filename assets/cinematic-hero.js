import { getScrollContainer, scrollTo } from '@theme/scroll-container';

class CinematicHero extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    document.addEventListener('shopify:section:load', this.updateControl);
    document.addEventListener('shopify:section:unload', this.updateControl);
    document.addEventListener('shopify:section:reorder', this.updateControl);
    document.addEventListener('DOMContentLoaded', this.updateControl, { once: true });
    this.updateControl();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    document.removeEventListener('shopify:section:load', this.updateControl);
    document.removeEventListener('shopify:section:unload', this.updateControl);
    document.removeEventListener('shopify:section:reorder', this.updateControl);
    document.removeEventListener('DOMContentLoaded', this.updateControl);
  }

  nextSection() {
    let next = this.closest('.shopify-section')?.nextElementSibling;
    while (next && !next.matches('.shopify-section')) next = next.nextElementSibling;
    return next;
  }

  updateControl = () => {
    const control = this.querySelector('[data-hero-scroll]');
    if (control) control.hidden = !this.nextSection();
  };

  handleClick = (event) => {
    if (!event.target.closest('[data-hero-scroll]')) return;
    const next = this.nextSection();
    if (!next) return;
    const container = getScrollContainer();
    const root = container === document.scrollingElement || container === document.documentElement;
    const containerTop = root ? 0 : container.getBoundingClientRect().top;
    const header = document.querySelector('header-component[sticky]');
    const offset = header?.getBoundingClientRect().height ?? 0;
    const top = next.getBoundingClientRect().top - containerTop + container.scrollTop - offset;
    // Move keyboard focus with the viewport without triggering another scroll.
    if (!next.hasAttribute('tabindex')) {
      next.setAttribute('tabindex', '-1');
      next.addEventListener('blur', () => next.removeAttribute('tabindex'), { once: true });
    }
    next.focus({ preventScroll: true });
    scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
}

if (!customElements.get('cinematic-hero')) customElements.define('cinematic-hero', CinematicHero);
