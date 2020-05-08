import store from '../../store';
import Layer from './AbstractLayer';
import { cssClasses } from '../../constants';
const KojiWorker = require('worker-loader?inline!../../koji-lang.worker');

export default class HilightLayer extends Layer {
	errorOverlays: HTMLElement[] = [];
	parenOverlays: HTMLElement[] = [];
	inlineOverlays: HTMLElement[] = [];
	blockOverlays: HTMLElement[] = [];
	timerId = 0;
	worker: Worker = new KojiWorker();
	waitingParse = false;

	constructor() {
		super();
		this.$el.classList.add(cssClasses.HIGHLIGHT_LAYER);
		this.setupWorker();
		store.$watch('src', () => {
			this.prepareParsing();
		});
		store.$watch('parseResult', () => {
			this.renderErrors();
		});
		store.$watch([ 'selection', 'src' ], () => {
			if (!store.isRegionSelected) {
				this.renderParenPairHighlight();
				this.renderInlineHighlight();
				this.renderBlockHighlight();
			}
		});
	}

	private setupWorker() {
		this.worker.onmessage = (ev) => {
			if (ev.data.type === 'parse') {
				store.SET_PARSE_RESULT(ev.data.result);
			}
		};
	}

	private prepareParsing() {
		if (this.waitingParse) {
			window.clearTimeout(this.timerId);
		}
		this.timerId = window.setTimeout(() => {
			this.worker.postMessage({ type: 'parse', src: store.state.src.text });
			this.waitingParse = false;
		}, 10);
	}

	removeErrorDivs() {
		this.errorOverlays.forEach((e) => e.remove());
		this.errorOverlays = [];
	}

	renderErrors() {
		this.removeErrorDivs();
		if (!store.state.parseResult) return;
		const errors: [] = store.state.parseResult.errors;
		if (errors && errors.length > 0) {
			errors.forEach((e: any) => {
				let start: number, stop: number;
				if (e.offendingSymbol) {
					start = e.offendingSymbol.start;
					stop = e.offendingSymbol.stop;
				} else {
					start = this.inlinePosToAbsolutePos(e.line, e.charPositionInLine);
					stop = start;
				}
				const rects = this.getRectsOfRegion(start, stop + 1);

				rects.forEach((rect) => {
					const overlay = this.h('div', cssClasses.ERROR);
					overlay.style.left = rect.left + 'px';
					overlay.style.top = rect.top + 'px';
					overlay.style.width = rect.width + 'px';
					overlay.style.height = rect.height + 'px';
					this.errorOverlays.push(overlay);
					this.$el.append(overlay);
				});
			});
		}
	}

	renderInlineHighlight() {
		this.inlineOverlays.forEach((o) => o.remove());
		this.inlineOverlays = [];
		const pos = store.state.selection.start;
		const parseResult = store.state.parseResult;
		if (!parseResult) return;
		const inlines = parseResult.ast.inlines;
		const inline = inlines.find((i) => pos >= i.location.start && pos <= i.location.stop);
		if (!inline) return;
		const inlineOverlays = this.buildOverlay(
			inline.location.start,
			inline.location.stop,
			cssClasses.INLINE_HIGHLIGHT
		);
		inlineOverlays.forEach((o) => {
			this.$el.append(o);
			this.inlineOverlays.push(o);
		});
	}

	renderBlockHighlight() {
		this.blockOverlays.forEach((o) => o.remove());
		this.blockOverlays = [];
		const pos = store.state.selection.start;
		const parseResult = store.state.parseResult;
		if (!parseResult) return;
		const blocks = parseResult.ast.blocks;
		const block = blocks.find((b) => pos >= b.location.start && pos <= b.content.start);
		if (!block) return;
		const blockOverlays = this.buildOverlay(block.content.start, block.content.stop, cssClasses.BLOCK_HIGHLIGHT);
		blockOverlays.forEach((o) => {
			this.$el.append(o);
			this.blockOverlays.push(o);
		});
	}

	renderParenPairHighlight() {
		this.parenOverlays.forEach((o) => o.remove());
		this.parenOverlays = [];
		const sel = store.state.selection;
		const parseResult = store.state.parseResult;
		if (!parseResult) return;
		const parens = parseResult.ast.parens;
		const paren = parens.find((p) => {
			return sel.start === p.start || sel.end === p.stop || sel.start === p.start + 1 || sel.end === p.stop + 1;
		});
		if (!paren) return;
		const startOverlay = this.buildOverlay(paren.start, paren.start, cssClasses.PAREN);
		const stopOverlay = this.buildOverlay(paren.stop, paren.stop, cssClasses.PAREN);
		startOverlay.forEach((o) => {
			this.$el.append(o);
			this.parenOverlays.push(o);
		});
		stopOverlay.forEach((o) => {
			this.$el.append(o);
			this.parenOverlays.push(o);
		});
	}

	private buildOverlay(start: number, stop: number, cssClass: string) {
		const rects = this.getRectsOfRegion(start, stop + 1);
		return rects.map((rect) => {
			const overlay = this.h('div', cssClass);
			overlay.style.left = rect.left + 'px';
			overlay.style.top = rect.top + 'px';
			overlay.style.width = rect.width + 'px';
			overlay.style.height = rect.height + 'px';
			return overlay;
		});
	}
}
