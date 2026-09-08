class FounderStory extends HTMLElement {
  connectedCallback() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.reveal();
    }, { threshold: 0 });
    this.dataset.reveal = 'pending';
    this.observer.observe(this);
    this.addEventListener('shopify:block:select', this.reveal);
    this.addEventListener('shopify:section:select', this.reveal);
  }

  reveal = () => {
    this.dataset.reveal = 'visible';
    this.observer?.disconnect();
  };

  disconnectedCallback() {
    this.observer?.disconnect();
    this.removeEventListener('shopify:block:select', this.reveal);
    this.removeEventListener('shopify:section:select', this.reveal);
    delete this.dataset.reveal;
  }
}
if (!customElements.get('founder-story')) customElements.define('founder-story', FounderStory);
