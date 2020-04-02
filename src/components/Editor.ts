import HiddenTextArea from './HiddenTextArea';
import Display from './Display';
import BaseComponent from './BaseComponent';
import store from '../store';

export default class Editor extends BaseComponent {
  $el: HTMLElement;
  $linenumBg: HTMLElement;
  lineIndicatorHeight = 30;

  constructor(parentEl: HTMLElement, src = '') {
    super();
    this.$el = document.createElement('div');
    this.$el.classList.add('koji-editor');
    this.$linenumBg = this.h('div', 'koji-editor-linenum-bg');
    this.$el.appendChild(this.$linenumBg);
    this.add(new HiddenTextArea());
    this.add(new Display());
    parentEl.appendChild(this.$el);
    parentEl.addEventListener('resize', () => this.resize());
    this.resize();
    store.SET_REQUESTED_SRC(src);
    store.SET_INITIALIZED(true);
  }

  resize() {
    const parent = this.$el.parentElement;
    const width = parent!.clientWidth || 600;
    const height = parent!.clientHeight - this.lineIndicatorHeight || 600;
    this.setSize(width, height);
    store.SET_EDITOR_SIZE(width, height);
  }
}
