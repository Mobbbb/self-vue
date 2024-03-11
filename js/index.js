function SelfVue (options) {
    this.data = options.data;
    this.methods = options.methods;

    Object.keys(this.data).forEach(key => {
        this.proxyKeys(key);
    });

    Object.keys(this.methods).forEach(key => {
        this.proxyMethods(key);
    });

    observe(this.data);
    new Compile(options.el, this);
    options.mounted.call(this); // 所有事情处理好后执行mounted函数
}

SelfVue.prototype = {
    proxyKeys: function (key) {
        var self = this;

        // 将this.data[key] 代理至 this[key]
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get: function getter () {
                return self.data[key];
            },
            set: function setter (newVal) {
                self.data[key] = newVal;
            }
        });
    },
    proxyMethods: function (key) {
        var self = this;
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get: function getter () {
                return self.methods[key];
            },
        });
    },
}
