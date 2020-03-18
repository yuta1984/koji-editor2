import BaseComponent from "./BaseComponent";
import store from "../store";


export default class SourceSelector extends BaseComponent {
    $el: HTMLElement;
    selDivs: HTMLDivElement[];
    caret: HTMLSpanElement;

    constructor() {
        super();
        this.$el = this.h('div', 'koji-editor-overlay');
        this.caret = this.h('span', 'koji-editor-caret');
        this.$el.appendChild(this.caret)
        this.hideCaret()
        this.selDivs = [];

        store.$watch('editorSize', () => {
            this.resize(store.state.editorSize.width, store.state.editorSize.height);
        });
        store.$watch('selectedRects', () => {
            store.isRegionSelected ? this.renderSelections() : this.renderSelections()
        });
        store.$watch(['caretPos'], () =>
            store.isRegionSelected ? this.hideCaret() : this.moveCaret()
        )
        store.$watch('focus', () => {
            store.state.focus ? this.moveCaret() : this.hideCaret()
        })
    }

    moveCaret() {
        this.caret.style.display = "block"
        this.caret.style.top = store.state.caretPos.y + "px"
        this.caret.style.left = store.state.caretPos.x + "px"
    }

    hideCaret() {
        this.caret.style.display = 'none'
    }

    renderSelections() {
        const rects = store.state.selectedRects;
        this.resetSelection();
        rects.forEach(rect => {
            const div = document.createElement("div");
            div.classList.add('koji-editor-selection');
            div.style.width = `${rect.width}px`;
            div.style.height = `${rect.height}px`;
            div.style.top = `${rect.top}px`;
            div.style.left = `${rect.left}px`;
            this.selDivs.push(div);
            this.$el.appendChild(div);
        });
    }

    resetSelection() {
        this.selDivs.forEach(div => div.remove());
        this.selDivs = [];
    }

    resize(width: number, height: number) {
        this.$el.style.width = width + "px";
        this.$el.style.height = height + "px";
    }



}