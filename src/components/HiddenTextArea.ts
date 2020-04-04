import store from '../store';
import BaseComponent from './BaseComponent';

export default class HiddenTextArea extends BaseComponent {
  $el: HTMLTextAreaElement;

  constructor() {
    super();
    this.$el = document.createElement('textarea');
    this.$el.classList.add('koji-editor-textarea');
    this.observeFocus();
    this.observeInput();
    this.observeSelection();
    this.observeScroll();
    this.observeResize();
    this.observeComposition();
    this.observeKeyEvent();
    //setTimeout(() => store.SET_EDITOR_SIZE(this.$el.clientWidth, this.$el.clientHeight), 100);

    store.$watch('requestedSrc', () => {
      const text = store.state.requestedSrc;
      this.$el.value = text;
      store.SET_INPUT({ srcText: text, selection: { start: 0, end: 0 } });
    });

    store.$watch('requestedSelection', () => {
      const sel = store.state.requestedSelection;
      this.$el.selectionStart = sel.start;
      this.$el.selectionEnd = sel.end;
    });

    store.$watch('editorSize', () => {
      const { width, height } = store.state.editorSize;
      this.setSize(height, width);
      this.$el.style.left = width + 'px';
    });

    store.$watch('requestFocus', () => {
      if (store.state.requestFocus) this.$el.focus();
    });

    store.$watch('initialized', () => {
      store.SET_SCROLL_WIDTH(this.$el.scrollHeight);
    });
  }

  observeFocus() {
    this.$el.addEventListener('focus', () => {
      store.SET_FOCUS(true);
    });
    this.$el.addEventListener('blur', () => {
      store.SET_FOCUS(false);
    });
  }

  observeInput() {
    this.$el.addEventListener('input', (event: Event) => {
      store.SET_INPUT({
        srcText: this.$el.value,
        inputEvent: <InputEvent>event,
        selection: {
          start: this.$el.selectionStart,
          end: this.$el.selectionEnd,
        },
      });
      store.SET_SCROLL_WIDTH(this.$el.scrollHeight);
    });
    store.SET_SELECTION({
      start: this.$el.selectionStart,
      end: this.$el.selectionEnd,
    });
  }

  observeSelection() {
    // events that can chenge selection
    const eventTypes = [
      'keydown',
      'keypress',
      'keyup',
      'mousedown',
      'touchstart',
      'input',
      'paste',
      'cut',
      'mousemove',
      'select',
      'selectstart',
      'click',
      'mouseup',
    ];
    // update store if selection is changed
    const checkSelection = (e: Event) => {
      const activeElement = document.activeElement;
      if (activeElement != this.$el) return;
      if (
        this.$el.selectionStart !== store.state.selection.start ||
        this.$el.selectionEnd !== store.state.selection.end
      ) {
        store.SET_SELECTION({
          start: this.$el.selectionStart,
          end: this.$el.selectionEnd,
        });
      }
    };
    eventTypes.forEach(e => {
      this.$el.addEventListener(e, checkSelection);
    });
  }

  observeScroll() {
    this.$el.addEventListener('scroll', event => {
      //store.SET_SCROLL_WIDTH(this.$el.scrollHeight);
      store.SET_SCROLL(this.$el.scrollTop);
    });
  }

  observeResize() {
    this.$el.addEventListener('resize', event => {
      store.SET_SCROLL(this.$el.scrollTop);
    });
  }

  observeComposition() {
    this.$el.addEventListener('compositionstart', e => {
      store.SET_COMPOSITION_ACTIVE(true);
      store.SET_COMPOSITION_RECTS([]);
    });
    this.$el.addEventListener('compositionupdate', (e: any) => {
      store.SET_COMPOSITION_TEXT(e.data);
      store.SET_COMPOSITION_ACTIVE(true);
    });
    this.$el.addEventListener('compositionend', e => {
      store.SET_COMPOSITION_ACTIVE(false);
      store.SET_COMPOSITION_RECTS([]);
    });
  }

  observeKeyEvent() {
    this.$el.addEventListener('keydown', e => {
      store.SET_KEYBOARD_EVENT(e);
    });
  }
}
