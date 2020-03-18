export default abstract class BaseComponent {

    abstract $el: HTMLElement;
    components: BaseComponent[] = []

    constructor() {

    }

    observeEl(eventNames: string[], handler: (event: Event) => void) {
        for (let name in eventNames) {
            this.$el.addEventListener(name, handler)
        }
    }

    protected h(elemName: string, ...className: string[]): HTMLElement {
        const elem = document.createElement(elemName)
        for (let cls of className) {
            elem.classList.add(cls)
        }
        return elem
    }

    add(comp: BaseComponent) {
        this.components.push(comp)
        this.$el.appendChild(comp.$el)
    }

}