import HiddenTextArea from './HiddenTextArea';
import Display from './Display';
import BaseComponent from './BaseComponent';

export default class Editor extends BaseComponent {

    $el: HTMLElement


    constructor(parentEl: HTMLElement) {
        super()
        this.$el = document.createElement("div")
        this.$el.classList.add('koji-editor')
        this.add(new HiddenTextArea())
        this.add(new Display())
        parentEl.appendChild(this.$el)
    }


}