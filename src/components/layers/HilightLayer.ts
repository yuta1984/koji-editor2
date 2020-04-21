import store from '../../store';
import Layer from './AbstractLayer';
import { cssClasses } from '../../constants';
const KojiWorker = require('worker-loader?inline!../../koji-lang.worker');

export default class HilightLayer extends Layer {
	errorHighlights: HTMLElement[] = [];
	timerId = 0;
	worker: Worker;
	waitingParse = false;
	parseResult: any;

	constructor() {
		super();
		this.$el.classList.add(cssClasses.HIGHLIGHT_LAYER);
		this.worker = new KojiWorker();
		this.worker.onmessage = (ev) => {
			if (ev.data.type === 'parse') this.parseResult = ev.data.result;
		};
		store.$watch('input', () => {
			this.prepareParsing();
		});
	}

	private prepareParsing() {
		if (this.waitingParse) {
			window.clearTimeout(this.timerId);
		}
		this.timerId = window.setTimeout(() => {
			this.worker.postMessage({ type: 'parse', src: store.state.src.text });
			this.waitingParse = false;
		}, 500);
	}

	private resetHilight() {
		this.errorHighlights.forEach((e) => e.remove());
		this.errorHighlights = [];
	}
}
