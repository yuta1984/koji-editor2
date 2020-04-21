import store from '../../store';
import Layer from './AbstractLayer';
import { cssClasses } from '../../constants';

export default class CaretLayer extends Layer {

    $caret = this.h('span', cssClasses.CARET);

    constructor() {
        super();
        this.$el.classList.add(cssClasses.CARET_LAYER)
        this.$el.appendChild(this.$caret)

        store.$watch(['caretPos', 'input'], () => {
            if (store.state.focus && !store.isRegionSelected) {
                this.moveCaret();
            } else {
                this.hideCaret();
            }
        });

    }

    moveCaret() {
        this.$caret.style.display = 'block';
        this.$caret.style.top = store.state.caretPos.y + 'px';
        this.$caret.style.left = store.state.caretPos.x + 'px';
    }

    hideCaret() {
        this.$caret.style.display = 'none';
    }


}