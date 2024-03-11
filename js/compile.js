function Compile(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    this.fragment = null;
    this.init();
}

Compile.prototype = {
    init: function () {
        if (this.el) {
            this.fragment = this.nodeToFragment(this.el);
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        } else {
            console.log('Dom元素不存在');
        }
    },
    nodeToFragment: function (el) {
        var fragment = document.createDocumentFragment();
        var child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild
        }
        return fragment;
    },
    compileElement: function (el) {
        var childNodes = el.childNodes;
        var self = this;
        [].slice.call(childNodes).forEach(function(node) {
            var reg = /\{\{(.*)\}\}/;
            var text = node.textContent;

            if (self.isElementNode(node)) {  
                self.compile(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, reg.exec(text)[1], text.split(reg.exec(text)[0]));
            }

            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        });
    },
    compile: function(node) {
        var nodeAttrs = node.attributes;
        var self = this;
        Array.prototype.forEach.call(nodeAttrs, function(attr) {
            var attrName = attr.name;
            if (self.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (self.isEventDirective(dir)) {  // 事件指令
                    self.compileEvent(node, self.vm, exp, dir);
                } else {  // v-model 指令
                    self.compileModel(node, self.vm, exp, dir);
                }
                // TODO 其他指令
                node.removeAttribute(attrName);
            }
        });
    },
    compileText: function(node, exp, appendArr) {
        var self = this;
        var initText = this.getVmExp(exp);
        this.textNodeUpdater(node, initText, appendArr);
        new Watcher(this.vm, function () {
            return self.getVmExp(exp)
        }, function (value) {
            self.textNodeUpdater(node, value, appendArr);
        });
    },
    compileEvent: function (node, vm, exp, dir) {
        var eventType = dir.split(':')[1];
        var cb = vm.methods && vm.methods[exp];

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);
        }
    },
    compileModel: function (node, vm, exp, dir) {
        var self = this;
        var val = this.getVmExp(exp);
        this.modelNodeUpdater(node, val);
        new Watcher(this.vm, function () {
            return self.getVmExp(exp)
        }, function (value) {
            self.modelNodeUpdater(node, value);
        });

        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            self.setVmExp(exp, newValue)
            val = newValue;
        });
    },
    setVmExp(exp, val) {
        if (exp.indexOf('.') > -1) {
            const expArr = exp.split('.')
            this.setVmValue(this.vm, expArr, val, expArr.length - 1)
        } else {
            this.vm[exp] = val
        }
    },
    getVmExp(exp) {
        if (exp.indexOf('.') > -1) {
            const expArr = exp.split('.')
            return this.getVmValue(this.vm, expArr, expArr.length - 1)
        } else {
            return this.vm[exp]
        }
    },
    setVmValue(obj, expArr, val, length, index = 0) {
        if (index === length) {
            obj[expArr[index]] = val
        } else {
            const next = index + 1
            this.setVmValue(obj[expArr[index]], expArr, val, length, next)
        }
    },
    getVmValue(obj, expArr, length, index = 0) {
        if (index === length) {
            return obj[expArr[index]]
        } else {
            const next = index + 1
            return this.getVmValue(obj[expArr[index]], expArr, length, next)
        }
    },
    textNodeUpdater: function (node, value, appendArr) {
        let formatValue  = typeof value == 'undefined' ? '' : value;
        node.textContent = appendArr[0] + formatValue + appendArr[1]
    },
    modelNodeUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    },
    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },
    isEventDirective: function(dir) {
        return dir.indexOf('on:') === 0;
    },
    isElementNode: function (node) {
        return node.nodeType == 1;
    },
    isTextNode: function(node) {
        return node.nodeType == 3;
    }
}
