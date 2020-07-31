import store from '../../store';
import Layer from './AbstractLayer';
import { cssClasses } from '../../constants';
import { notEqual } from 'assert';

export default class CaretLayer extends Layer {
	$caret = this.h('span', cssClasses.CARET);
	$tagInfo = this.h('span', cssClasses.TAG_INFO);

	constructor() {
		super();
		this.$el.classList.add(cssClasses.CARET_LAYER);
		this.$el.appendChild(this.$caret);
		this.$el.appendChild(this.$tagInfo);
		this.hideTagInfo();

		store.$watch(['caretPos', 'input'], () => {
			if (store.state.focus && !store.isRegionSelected) {
				this.moveCaret();
				this.renderTagInfo();
			} else {
				this.hideCaret();
				this.hideTagInfo();
			}
		});

		store.$watch('selection', () => { });
	}

	moveCaret() {
		this.$caret.style.display = 'block';
		this.$caret.style.top = store.state.caretPos.y + 'px';
		this.$caret.style.left = store.state.caretPos.x + 'px';
	}

	hideCaret() {
		this.$caret.style.display = 'none';
	}

	renderTagInfo() {
		const node = store.state.currentNode;
		if (node) {
			let info = `タグ：${node.name}`;
			this.$tagInfo.style.display = 'block';
			const rect = this.$caret.getBoundingClientRect();
			this.$tagInfo.style.top = rect.top + "px";
			this.$tagInfo.style.left = rect.left + "px";
			if (node.id) {
				info += '<br/>';
				info += `ID=${node.id}`;
			}
			if (node.classes && node.classes.length > 0) {
				info += '<br/>';
				info += `クラス=${node.classes.join(', ')}`;
			}
			if (node.name == '注釈') {
				const anno = node.children[0].join('').replace(/\//g, '<br/>');
				info += "<br>" + anno;
			}
			this.$tagInfo.innerHTML = info;
		} else {
			this.hideTagInfo();
		}
	}

	hideTagInfo() {
		this.$tagInfo.style.display = 'none';
	}
}
