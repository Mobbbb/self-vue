function Watcher(vm, getVmExp, nodeUpdater) {
    this.getVmExp = getVmExp;
    this.nodeUpdater = nodeUpdater;
    this.vm = vm;
    this.value = this.get();  // 将自己添加到订阅器的操作
}

Watcher.prototype = {
    update: function() {
        var value = this.getVmExp();
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.nodeUpdater.call(this.vm, value, oldVal);
        }
    },
    get: function() {
        Dep.target = this;  // 缓存自己
        var value = this.getVmExp();  // 强制执行监听器里的get函数
        Dep.target = null;  // 释放自己
        return value;
    }
};
