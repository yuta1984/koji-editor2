import { isArray } from "util";

export function ObserveEvent(eventNames: string[]) {
    return function (target: any, name: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        const constructor = target.constructor
        const newConstructor = function (this: any, ...args: any) {
            const result = constructor.apply(this, args)
            for (let name in eventNames) {
                this.$el.addEventListener(name, method)
            }
            return result
        }


    }
}
