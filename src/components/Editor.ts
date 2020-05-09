import HiddenTextArea from './HiddenTextArea';
import Display from './Display';
import BaseComponent from './BaseComponent';
import store, { StateName } from '../store';
import { cssClasses } from '../constants';

export default class Editor extends BaseComponent {
	$el: HTMLElement;
	$linenumBg: HTMLElement;
	lineIndicatorHeight = 30;

	constructor(parentEl: HTMLElement, src = '') {
		super();
		this.$el = document.createElement('div');
		this.$el.classList.add(cssClasses.EDITOR);
		this.$linenumBg = this.h('div', cssClasses.LINENUM_BG);
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

	insertOrReplace(text: string) {
		const src = store.state.src.text;
		const { start, end } = store.state.selection;
		this.focus();
		if (start !== end) document.execCommand('delete');
		document.execCommand('insertText', false, text);
		store.SET_REQUESTED_SRC(store.state.src.text); // to trigger renderAll()
		store.SET_REQUESTED_SELECTION({ start: start, end: start + text.length });
	}

	markup(pre: string, post: string) {
		const text = pre + this.selectedText + post;
		this.insertOrReplace(text);
	}

	focus() {
		store.SET_REQUEST_FOCUS(true);
	}

	setSelection(start: number, end: number) {
		store.SET_REQUESTED_SELECTION({ start, end });
	}

	watch(state: StateName, handler: () => void) {
		store.$watch(state, handler);
	}

	get value(): string {
		return store.state.src.text;
	}

	get selectedText(): string {
		return store.selectedText;
	}

	get selection() {
		return store.state.selection;
	}

	get selectionWithLineNums() {
		return store.getSelectionWithLineNum;
	}

	get parseResult() {
		return store.state.parseResult;
	}

	get htmlString() {
		return store.state.htmlString;
	}
}
