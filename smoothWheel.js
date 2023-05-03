const smoothWheel_defaultOptions = {
    friction: 0.1,
    minDelta: 0.001,
    deltaSpeed: 1.25,
    smoothDelta: 0.1
}

HTMLElement.prototype.smoothWheel = function(callback, options = {}) {
    var self = this;
    
    self.options = smoothWheel_defaultOptions;
    for (var opt in options) { self.options[opt] = options[opt] }
    
    self.vars = {
        velocity: {
            x: 0,
            y: 0,
        },
        delta: {
            x: 0,
            y: 0,
            
            smoothX: 0,
            smoothY: 0
        },
        animation: {
            runner: null,
            active: false,
            
            timeStamp: 0,
            timePrev: 0,
            deltaTime: 0,
            deltaFrame: 0
        },
        fn: {
            clamp: function(value, min, max) {
                return value < min ? min : value > max ? max : value;
            },
            lerp: function(current, target, range) {
                range = self.vars.fn.clamp(range, 0, 1);
                return current + (target - current) * range;
            }
        }
    }
    
    self.vars.animation.runner = function() {
        self.vars.animation.timeStamp = performance.now();
        self.vars.animation.deltaTime = self.vars.animation.timeStamp - self.vars.animation.timePrev;
        self.vars.animation.deltaFrame = self.vars.animation.deltaTime / (1000 / 60);
        self.vars.animation.timePrev = self.vars.animation.timeStamp;
        
        self.vars.velocity.x = self.vars.delta.smoothX * self.vars.animation.deltaFrame;
        self.vars.velocity.y = self.vars.delta.smoothY * self.vars.animation.deltaFrame;
        
        self.vars.delta.x = self.vars.fn.lerp(self.vars.delta.x, 0, self.vars.animation.deltaFrame * self.options.friction);
        self.vars.delta.y = self.vars.fn.lerp(self.vars.delta.y, 0, self.vars.animation.deltaFrame * self.options.friction);
        self.vars.delta.smoothX = self.vars.fn.lerp(self.vars.delta.smoothX, self.vars.delta.x, self.vars.animation.deltaFrame * self.options.smoothDelta);
        self.vars.delta.smoothY = self.vars.fn.lerp(self.vars.delta.smoothY, self.vars.delta.y, self.vars.animation.deltaFrame * self.options.smoothDelta);
        
        if (
            (Math.abs(self.vars.delta.x) < self.options.minDelta && Math.abs(self.vars.delta.smoothX) < self.options.minDelta) &&
            (Math.abs(self.vars.delta.y) < self.options.minDelta && Math.abs(self.vars.delta.smoothY) < self.options.minDelta)
        ) {
            self.vars.delta.x = 0;
            self.vars.delta.y = 0;
            self.vars.delta.smoothX = 0;
            self.vars.delta.smoothY = 0;
            
            self.vars.animation.active = false;
        }
        
        
        callback({
            deltaX: self.vars.velocity.x,
            deltaY: self.vars.velocity.y,
            animation: {...self.vars.animation},
            element: self
        })
        
        if (self.vars.animation.active) window.requestAnimationFrame(self.vars.animation.runner);
    }
    
    var _run = function() {
        if (self.vars.animation.active) return;
        
        self.vars.velocity.x = 0;
        self.vars.velocity.y = 0;
        
        self.vars.animation.active = true;
        self.vars.animation.timePrev = performance.now() + (1000 / 60);
        self.vars.animation.runner();
    }
    
    var _wheel = function(event) {
        self.vars.delta.x = event.deltaX * self.options.deltaSpeed;
        self.vars.delta.y = event.deltaY * self.options.deltaSpeed;
        
        _run();
    }
    
    self.addEventListener("wheel", _wheel);
    
    
    self.state = {};
    self.state.setOptions = function(options) {
        if (typeof options != "object") {
            console.error("Invalid object");
            return;
        }
        else if (!options) {
            console.warn("No options set");
            return;
        }
        for (var opt in options) { self.options[opt] = options[opt] }
    }
    self.state.setDelta = function(x, y) {
        self.vars.delta.x = x;
        self.vars.delta.y = y;
        
        _run();
    }
    self.state.byDelta = function(x, y) {
        self.vars.delta.x += x;
        self.vars.delta.y += y;
        
        _run();
    }
    self.state.stop = function() {
        self.vars.delta.x = 0;
        self.vars.delta.y = 0;
        self.vars.delta.smoothX = 0;
        self.vars.delta.smoothY = 0;
        
        self.vars.animation.active = false;
    }
    self.state.destroy = function() {
        self.removeEventListener("wheel", _wheel);
        delete self;
    }
    
    return self;
}