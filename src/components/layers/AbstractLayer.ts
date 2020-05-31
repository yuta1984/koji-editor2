import BaseComponent from '../BaseComponent';
import store from '../../store';
import { cssClasses } from '../../constants';

export default abstract class Layer extends BaseComponent {
	$el: HTMLElement;
	//$srcPanel: Element;

	constructor() {
		super();
		this.$el = this.h('div', cssClasses.LAYER);
		store.$watch('editorSize', () => {
			this.resize(store.state.editorSize.width, store.state.editorSize.height);
		});
		store.$watch([ 'scroll' ], () => {
			const offset = this.$el.scrollWidth - this.$el.clientWidth - store.state.scroll;
			this.$el.scrollTo(offset, 0);
		});
		store.$watch('scrollWidth', () => {
			this.$el.style.width = store.state.scrollWidth + 'px';
		});
		store.$watch('disabled', () => {
			this.$el.style.display = store.state.disabled ? 'none' : 'block';
		});
	}

	get $srcPanel() {
		return document.querySelector('.' + cssClasses.SRC_PANEL)!;
	}

	get $dispaly() {
		return document.querySelector('.' + cssClasses.DISPLAY)!;
	}

	resize(width: number, height: number) {
		this.$el.style.width = width + 'px';
		this.$el.style.height = height + 'px';
	}

	getRectsOfRegion(start: number, end: number): DOMRect[] {
		const chars = this.getCharElemsAt(start, end);
		return chars.map((c) => this.createRelativeRect(c));
	}

	getCharElemsAt(start: number, end: number): Element[] {
		const chars = this.$srcPanel.querySelectorAll('.char');
		return Array.from(chars).slice(start, end);
	}

	inlinePosToAbsolutePos(lineNum: number, pos: number): number {
		const text = store.state.src.text;
		let abspos = 0;
		text.split('\n').slice(0, lineNum - 1).forEach((l) => (abspos += l.length + 1));
		abspos += pos;
		return abspos;
	}

	createRelativeRect(elem: Element): DOMRect {
		const rect = elem.getBoundingClientRect();
		const parentRect = this.$srcPanel.getBoundingClientRect();
		const srcPanelWidth = this.$srcPanel.clientWidth;
		const offset = srcPanelWidth - this.$dispaly.clientWidth;
		rect.x = rect.x - parentRect.x - offset;
		rect.y = rect.y - parentRect.y;
		return rect;
	}
}
