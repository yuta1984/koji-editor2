import store from "../store/index";
import { StateKey } from "../store/index";

export function KojiComponent(target: any) {
  const original = target;
  const rewritten: any = function(this: any) {
    const ret = original.apply(this, arguments);
    console.log("hoge", this.__proto__);
    return ret;
  };
  rewritten.prototype = original.prototype;
  return rewritten;
}

export function WatchStore(stateNames: StateKey[]) {
  return function(target: any, name: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    for (let name of stateNames) {
      target.__storeHandlers = target.__storeHandlers || {};
      target.__storeHandlers[name] = target.__storeHandlers[name] || [];
      target.__storeHandlers[name].push(descriptor.value);
    }
  };
}
