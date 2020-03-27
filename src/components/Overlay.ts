import BaseComponent from "./BaseComponent";
import store from "../store";
import { writeHeapSnapshot } from "v8";


export default class SourceSelector extends BaseComponent {
    $el: HTMLElement;
    selDivs: HTMLDivElement[] = [];
    compositionDivs: HTMLElement[] = [];
    caret: HTMLSpanElement;

    constructor() {
        super();
        this.$el = this.h('div', 'koji-editor-overlay');
        this.caret = this.h('span', 'koji-editor-caret');
        this.$el.appendChild(this.caret);
        this.hideCaret();
        this.selDivs = [];
        this.compositionDivs = [];

        store.$watch('editorSize', () => {
            this.resize(store.state.editorSize.width, store.state.editorSize.height);
        });
        store.$watch(['scroll'], () => {
            const offset =
                this.$el.scrollWidth -
                this.$el.clientWidth -
                store.state.scroll;
            this.$el.scrollTo(offset, 0);
        });
        store.$watch('scrollWidth', () => {
            this.$el.style.width = store.state.scrollWidth + "px";
        });

        store.$watch('selectedRects', () => {
            if (store.state.focus && store.isRegionSelected) {
                this.renderSelections();
            } else {
                this.resetSelection();
            };
        });
        store.$watch(['caretPos', 'input'], () => {
            if (store.state.focus && !store.isRegionSelected) {
                this.moveCaret();
            } else {
                this.hideCaret();
            }
        });
        store.$watch('focus', () => {
            if (store.state.focus) {
                this.moveCaret();
            } else {
                this.hideCaret();
            }
        });
        store.$watch('compositionRects', () => {
            const rects = store.state.compositionRects;
            this.resetCompositionRects();
            rects.forEach(r => {
                const div = this.h('div', 'koji-editor-composition-bar');
                div.style.top = r.y + "px";
                div.style.left = r.x + "px";
                div.style.height = r.height + "px";
                div.style.width = r.width + "px";
                this.compositionDivs.push(div);
                this.$el.appendChild(div);
            });
        });
    }

    resetCompositionRects() {
        this.compositionDivs.forEach(div => {
            div.remove();
        });
        this.compositionDivs = [];
    }

    moveCaret() {
        this.caret.style.display = "block";
        this.caret.style.top = store.state.caretPos.y + "px";
        this.caret.style.left = store.state.caretPos.x + "px";
    }

    hideCaret() {
        this.caret.style.display = 'none';
        //this.resetSelection();

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