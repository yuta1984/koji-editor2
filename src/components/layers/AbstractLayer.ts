import BaseComponent from '../BaseComponent';
import store from '../../store';
import { cssClasses } from '../../constants';

export default abstract class Layer extends BaseComponent {
    $el: HTMLElement;
    $srcPanel: Element;

    constructor() {
        super();
        this.$el = this.h('div', cssClasses.LAYER);
        this.$srcPanel = document.querySelector('.' + cssClasses.SRC_PANEL)!

        store.$watch('editorSize', () => {
            this.resize(store.state.editorSize.width, store.state.editorSize.height);
        });
        store.$watch(['scroll'], () => {
            const offset =
                this.$el.scrollWidth - this.$el.clientWidth - store.state.scroll;
            this.$el.scrollTo(offset, 0);
        });
        store.$watch('scrollWidth', () => {
            this.$el.style.width = store.state.scrollWidth + 'px';
        });
    }

    resize(width: number, height: number) {
        this.$el.style.width = width + 'px';
        this.$el.style.height = height + 'px';
    }

    getRectsOfRegion(start: number, end: number): DOMRect[] {
        const rects: DOMRect[] = []
        const chars = this.getCharElemsAt(start, end);
        const parentRect = this.$srcPanel.getBoundingClientRect();
        const srcPanelWidth = this.$srcPanel.clientWidth;
        const offset = srcPanelWidth - this.$el.clientWidth;
        let rect: DOMRect
        chars.forEach(c => {
            let current = c.getBoundingClientRect()
            if (!rect) {
                // initialize rect
                rect = current
                rect.x = rect.x - parentRect.x - offset;
                rect.y = rect.y - parentRect.y;
            }
            else if (rect.left !== current.left) {
                // if current char is in next line, push rect to ary and create new rect
                rects.push(rect)
                rect = current
                rect.x = rect.x - parentRect.x - offset;
                rect.y = rect.y - parentRect.y;
            } else {
                // if current char is in the same line, extend the height of rect
                rect.height += current.height
            }
        })
        return rects
    }

    private getCharElemsAt(start: number, end: number): Element[] {
        const chars = this.$srcPanel.querySelectorAll('.char');
        return Array.from(chars).slice(start, end);
    }

}
