import store from "../store";
import BaseComponent from "./BaseComponent";

export default class HiddenTextArea extends BaseComponent {
  $el: HTMLTextAreaElement;

  constructor() {
    super();
    this.$el = document.createElement("textarea");
    this.$el.classList.add("koji-editor-textarea");
    this.observeFocus();
    this.observeInput();
    this.observeSelection();
    this.observeScroll();
    this.observeResize();
    setTimeout(() => store.SET_EDITOR_SIZE(this.$el.clientWidth, this.$el.clientHeight), 100);
  }

  observeFocus() {
    this.$el.addEventListener("focus", () => {
      store.SET_FOCUS(true);
    });
    this.$el.addEventListener("blur", () => {
      store.SET_FOCUS(false);
    });
  }

  observeInput() {
    this.$el.addEventListener("input", (event: Event) => {
      store.SET_INPUT({
        srcText: this.$el.value, inputEvent: <InputEvent>event, selection: {
          start: this.$el.selectionStart,
          end: this.$el.selectionEnd
        }
      });
    });
    store.SET_SELECTION({
      start: this.$el.selectionStart,
      end: this.$el.selectionEnd
    });
  }

  observeSelection() {
    document.addEventListener("selectionchange", () => {
      const activeElement = document.activeElement;
      if (activeElement != this.$el) return;
      if (
        this.$el.selectionStart !== store.state.selection.start ||
        this.$el.selectionEnd !== store.state.selection.end
      ) {
        store.SET_SELECTION({
          start: this.$el.selectionStart,
          end: this.$el.selectionEnd
        });
      }
    });
  }

  observeScroll() {
    this.$el.addEventListener("scroll", event => {
      store.SET_SCROLL(this.$el.scrollTop);
    });
  }

  observeResize() {
    this.$el.addEventListener("resize", event => {
      store.SET_SCROLL(this.$el.scrollTop);
    });
  }


}
