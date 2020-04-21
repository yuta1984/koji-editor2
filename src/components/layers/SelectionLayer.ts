import store from '../../store';
import Layer from './AbstractLayer';

export default class SelectionLayer extends Layer {
	selDivs: HTMLDivElement[] = [];

	constructor() {
		super();
		this.$el.classList.add('koji-editor-selection-layer');
		store.$watch('selectedRects', () => {
			if (store.state.focus && store.isRegionSelected) {
				this.renderSelections();
			} else {
				this.resetSelection();
			}
		});
	}

	renderSelections() {
		const rects = store.state.selectedRects;
		this.resetSelection();
		rects.forEach((rect) => {
			const div = document.createElement('div');
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
		this.selDivs.forEach((div) => div.remove());
		this.selDivs = [];
	}
}
